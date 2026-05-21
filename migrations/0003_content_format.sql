-- Add Markdown/plain-text mode for saved content.
ALTER TABLE content_items ADD COLUMN format TEXT DEFAULT 'plain' CHECK(format IN ('plain', 'markdown'));
