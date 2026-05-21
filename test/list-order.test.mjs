import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const files = [
  '../src/app/api/words/route.ts',
  '../src/app/api/v1/words/route.ts',
  '../src/app/api/content/route.ts',
  '../src/app/api/v1/content/route.ts',
];

test('word and content list APIs use stable newest-first ordering', () => {
  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.match(
      source,
      /ORDER BY\s+(?:w\.|ci\.)?created_at DESC,\s+(?:w\.|ci\.)?id DESC/i,
      `${file} should order newest records by created_at and id`,
    );
  }
});
