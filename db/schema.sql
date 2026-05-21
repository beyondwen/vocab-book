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
  repetitions INTEGER DEFAULT 0, -- 连续成功复习次数
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

-- 内容库：句子和短段落
CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT NOT NULL,
  format TEXT DEFAULT 'plain' CHECK(format IN ('plain', 'markdown')),
  source TEXT,
  note TEXT,
  note_format TEXT DEFAULT 'plain' CHECK(note_format IN ('plain', 'markdown')),
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 内容与单词的关联
CREATE TABLE IF NOT EXISTS content_word_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  UNIQUE(content_id, word_id)
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
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at);
CREATE INDEX IF NOT EXISTS idx_content_word_links_content ON content_word_links(content_id);
CREATE INDEX IF NOT EXISTS idx_content_word_links_word ON content_word_links(word_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
