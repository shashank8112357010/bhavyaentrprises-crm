// middleware.ts
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { pathRoleAccess } from './constants/roleAccessConfig';


const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as keyof typeof pathRoleAccess;
    
    const pathname = request.nextUrl.pathname;

    const hasAccess = pathRoleAccess[role]?.some((path) => pathname.startsWith(path));

    if (!hasAccess) {
      console.log("hey you dont have access");
      
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
  } catch (err: any) {
    console.error('JWT verification failed:', err.message);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
