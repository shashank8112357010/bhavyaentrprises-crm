import { NextResponse, NextRequest } from 'next/server';

export async function GET(_req: NextRequest) {
  // Expire the token immediately
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),          
  });

  return response;
}
