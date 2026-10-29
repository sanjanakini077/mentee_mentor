import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify administrator role
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('id, role, department')
      .eq('user_id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'administrator') {
      return NextResponse.json(
        { error: 'Forbidden: only department administrators can provision faculty accounts' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, fullName, phone } = body

    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      )
    }

    const defaultPassword = password || 'Faculty@2024!'

    // Attempt RPC call to admin_create_faculty
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_create_faculty', {
      p_email: email.trim().toLowerCase(),
      p_password: defaultPassword,
      p_full_name: fullName.trim(),
      p_phone: phone?.trim() || null,
    })

    if (rpcError) {
      // If RPC is missing or threw, check if email already registered and elevate it directly
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({
            role: 'mentor',
            department: callerProfile.department,
            full_name: fullName.trim(),
            phone_number: phone?.trim() || null,
          })
          .eq('id', existingProfile.id)

        return NextResponse.json({
          success: true,
          message: 'Existing user account designated as Faculty Mentor.',
          profile_id: existingProfile.id,
        })
      }

      return NextResponse.json(
        {
          error: rpcError.message || 'Could not provision faculty account. Please run migration 5 in your Supabase SQL Editor.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(rpcData || { success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
