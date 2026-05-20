import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/auth-cookie';
import { isValidAdminToken } from '@/lib/admin-auth';

const PUBLIC_FILE_PATTERN = /\.(.*)$/;

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    PUBLIC_FILE_PATTERN.test(pathname)
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || '';
  const hasSession = sessionToken ? await isValidAdminToken(sessionToken) : false;

  if (pathname === '/login') {
    if (hasSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    const response = NextResponse.next();
    if (sessionToken) {
      response.cookies.delete(ADMIN_COOKIE_NAME);
    }
    return response;
  }

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    if (sessionToken) {
      response.cookies.delete(ADMIN_COOKIE_NAME);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
