import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { ADMIN_COOKIE_NAME } from '@/lib/auth-cookie';

function extractToken(request: NextRequest): string {
  const authHeader = request.headers.get('Authorization');
  const headerToken = request.headers.get('X-Admin-Token');
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return headerToken || cookieToken || '';
}

export async function getConfiguredToken(): Promise<string> {
  const processToken = process.env.VOCAB_BOOK_ADMIN_TOKEN?.trim();
  if (processToken) {
    return processToken;
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const envToken = (env as { VOCAB_BOOK_ADMIN_TOKEN?: string }).VOCAB_BOOK_ADMIN_TOKEN;
    return envToken?.trim() || '';
  } catch {
    return '';
  }
}

export async function requireAdmin(request: NextRequest) {
  const configuredToken = await getConfiguredToken();

  if (!configuredToken && process.env.NODE_ENV !== 'production') {
    return null;
  }

  if (!configuredToken) {
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

  if (extractToken(request) === configuredToken) {
    return null;
  }

  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: '无效的管理令牌' } },
    { status: 401 }
  );
}

export async function isValidAdminToken(token: string): Promise<boolean> {
  const configuredToken = await getConfiguredToken();

  if (!configuredToken && process.env.NODE_ENV !== 'production') {
    return true;
  }

  return Boolean(configuredToken) && token === configuredToken;
}
