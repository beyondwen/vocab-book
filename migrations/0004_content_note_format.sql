-- Track note rendering separately from body rendering.
ALTER TABLE content_items ADD COLUMN note_format TEXT DEFAULT 'plain' CHECK(note_format IN ('plain', 'markdown'));

-- Existing imported notes often already contain Markdown analysis.
UPDATE content_items
SET note_format = 'markdown'
WHERE note IS NOT NULL
  AND (
    note GLOB '#*'
    OR instr(note, char(10) || '#') > 0
    OR instr(note, '|---') > 0
    OR instr(note, char(10) || '> ') > 0
    OR instr(note, char(10) || '- ') > 0
  );
