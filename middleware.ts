import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // No token, redirect to root
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Optional: role-based access (example)
    const role = payload.role;
    const url = request.nextUrl.clone();

    if (url.pathname.startsWith('/admin') && role !== 'ADMIN') {
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (err: any) {
    console.error('JWT verification failed:', err.message);
    // Invalid or expired token, redirect to root
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'], // Secure routes
};
