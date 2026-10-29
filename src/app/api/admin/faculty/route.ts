import { NextResponse } from 'next/server'
import { provisionFacultyMentor } from '@/lib/services/adminService'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await provisionFacultyMentor({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      password: body.password,
    })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to provision faculty' },
      { status: 400 }
    )
  }
}
