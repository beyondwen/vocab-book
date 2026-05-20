import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_MAX_AGE, ADMIN_COOKIE_NAME } from '@/lib/auth-cookie';
import { getConfiguredToken, isValidAdminToken } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (typeof token !== 'string' || !token.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '请输入管理令牌' } },
        { status: 400 }
      );
    }

    const configuredToken = await getConfiguredToken();
    if (!configuredToken && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ADMIN_TOKEN_NOT_CONFIGURED',
            message: '生产环境必须配置 VOCAB_BOOK_ADMIN_TOKEN',
          },
        },
        { status: 503 }
      );
    }

    if (!(await isValidAdminToken(token.trim()))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '管理令牌不正确' } },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE_NAME, token.trim(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' || request.nextUrl.protocol === 'https:',
      path: '/',
      maxAge: ADMIN_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '登录失败' } },
      { status: 500 }
    );
  }
}
