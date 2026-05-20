import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { randomHex, sha256Hex } from '@/lib/crypto';

// GET /api/settings/api-keys - 获取 API Key 列表
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const keys = await dbAll(
      'SELECT id, name, last_used_at, created_at, expires_at FROM api_keys ORDER BY created_at DESC'
    );

    return NextResponse.json({ success: true, data: keys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '获取失败' } },
      { status: 500 }
    );
  }
}

// POST /api/settings/api-keys - 创建 API Key
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { name, expires_in_days } = body;

    // 检查数量限制
    const count = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM api_keys') || { count: 0 };
    if (count.count >= 5) {
      return NextResponse.json(
        { success: false, error: { code: 'LIMIT_EXCEEDED', message: '最多创建5个 API Key' } },
        { status: 400 }
      );
    }

    // 生成 API Key
    const apiKey = `vb_${randomHex(32)}`;
    const keyHash = await sha256Hex(apiKey);

    // 计算过期时间
    let expiresAt = null;
    if (expires_in_days) {
      const date = new Date();
      date.setDate(date.getDate() + expires_in_days);
      expiresAt = date.toISOString();
    }

    await dbRun(
      'INSERT INTO api_keys (key_hash, name, expires_at) VALUES (?, ?, ?)',
      [keyHash, name || null, expiresAt]
    );

    return NextResponse.json({
      success: true,
      data: {
        key: apiKey, // 只在创建时返回一次
        name,
        expires_at: expiresAt,
        message: '请妥善保存 API Key，关闭后将无法再次查看',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '创建失败' } },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/api-keys - 删除 API Key
export async function DELETE(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '请提供 Key ID' } },
        { status: 400 }
      );
    }

    await dbRun('DELETE FROM api_keys WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '删除失败' } },
      { status: 500 }
    );
  }
}
