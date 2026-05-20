-- 单词本数据库 Schema

-- 单词本/分组
CREATE TABLE IF NOT EXISTS wordbooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  word_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 单词表
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  phonetic TEXT,
  meaning TEXT NOT NULL,
  example TEXT,
  tags TEXT, -- JSON array
  status TEXT DEFAULT 'new' CHECK(status IN ('new', 'learning', 'mastered')),
  wordbook_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE SET NULL
);

-- 复习记录
CREATE TABLE IF NOT EXISTS review_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL,
  review_date DATETIME NOT NULL,
  result BOOLEAN NOT NULL, -- 1=记住, 0=忘记
  next_review_date DATETIME NOT NULL,
  interval INTEGER DEFAULT 1, -- 间隔天数
  ease_factor REAL DEFAULT 2.5, -- 难度因子
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_words_status ON words(status);
CREATE INDEX IF NOT EXISTS idx_words_wordbook ON words(wordbook_id);
CREATE INDEX IF NOT EXISTS idx_review_word ON review_records(word_id);
CREATE INDEX IF NOT EXISTS idx_review_next_date ON review_records(next_review_date);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
