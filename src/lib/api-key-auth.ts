import { NextRequest, NextResponse } from 'next/server';
import { ApiKey, dbGet, dbRun } from '@/lib/db';
import { sha256Hex } from '@/lib/crypto';

export async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const apiKey = request.headers.get('X-API-Key');

  let key = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    key = authHeader.substring(7);
  } else if (apiKey) {
    key = apiKey;
  }

  if (!key) {
    return null;
  }

  const keyHash = await sha256Hex(key);
  const record = await dbGet<ApiKey>(
    'SELECT * FROM api_keys WHERE key_hash = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
    [keyHash],
  );

  if (record) {
    await dbRun('UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?', [record.id]);
  }

  return record;
}

export async function requireApiKey(request: NextRequest) {
  const apiKey = await validateApiKey(request);
  if (apiKey) {
    return null;
  }

  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: '无效的 API Key' } },
    { status: 401 },
  );
}
