import { getCloudflareContext } from '@opennextjs/cloudflare';

export type SqlParam = string | number | boolean | null;

interface D1PreparedStatementLike {
  bind(...values: SqlParam[]): D1PreparedStatementLike;
  all<T>(): Promise<{ results?: T[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta?: { changes?: number; last_row_id?: number } }>;
}

interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch(statements: D1PreparedStatementLike[]): Promise<unknown[]>;
}

async function getDatabase(): Promise<D1DatabaseLike> {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as { DB?: D1DatabaseLike }).DB;

  if (!db) {
    throw new Error('D1 binding DB is not configured');
  }

  return db;
}

export async function dbAll<T>(query: string, params: SqlParam[] = []): Promise<T[]> {
  const db = await getDatabase();
  const result = await db.prepare(query).bind(...params).all<T>();
  return result.results || [];
}

export async function dbGet<T>(query: string, params: SqlParam[] = []): Promise<T | undefined> {
  const db = await getDatabase();
  const result = await db.prepare(query).bind(...params).first<T>();
  return result || undefined;
}

export async function dbRun(query: string, params: SqlParam[] = []) {
  const db = await getDatabase();
  const result = await db.prepare(query).bind(...params).run();

  return {
    changes: result.meta?.changes || 0,
    lastInsertRowid: result.meta?.last_row_id,
  };
}

export async function dbBatch(statements: { query: string; params?: SqlParam[] }[]) {
  const db = await getDatabase();
  return db.batch(statements.map((statement) => (
    db.prepare(statement.query).bind(...(statement.params || []))
  )));
}

export interface Word {
  id: number;
  word: string;
  phonetic: string | null;
  meaning: string;
  example: string | null;
  tags: string | null;
  status: 'new' | 'learning' | 'mastered';
  wordbook_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface WordWithContentCount extends Word {
  content_count: number;
}

export interface ReviewRecord {
  id: number;
  word_id: number;
  review_date: string;
  result: boolean;
  next_review_date: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  created_at: string;
}

export interface Wordbook {
  id: number;
  name: string;
  description: string | null;
  word_count: number;
  created_at: string;
}

export interface ContentItem {
  id: number;
  body: string;
  format: 'plain' | 'markdown';
  source: string | null;
  note: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentItemWithWordCount extends ContentItem {
  word_count: number;
}

export interface ContentWordLink {
  id: number;
  content_id: number;
  word_id: number;
  created_at: string;
}

export interface ApiKey {
  id: number;
  key_hash: string;
  name: string | null;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}
