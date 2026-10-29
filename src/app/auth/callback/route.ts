import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const next = requestUrl.searchParams.get('next') || '/auth/sign-in'
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
