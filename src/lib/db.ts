import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'vocab.db');

// 确保 data 目录存在
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// 启用 WAL 模式
db.pragma('journal_mode = WAL');

// 初始化数据库表
const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

export default db;

// 类型定义
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

export interface ReviewRecord {
  id: number;
  word_id: number;
  review_date: string;
  result: boolean;
  next_review_date: string;
  interval: number;
  ease_factor: number;
  created_at: string;
}

export interface Wordbook {
  id: number;
  name: string;
  description: string | null;
  word_count: number;
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
