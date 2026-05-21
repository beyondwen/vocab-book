import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const reviewPageSource = readFileSync(new URL('../src/app/review/page.tsx', import.meta.url), 'utf8');

test('review page renders related content notes with their saved format', () => {
  assert.match(reviewPageSource, /note:\s*string \| null/);
  assert.match(reviewPageSource, /note_format:\s*'plain' \| 'markdown'/);
  assert.match(reviewPageSource, /body=\{content\.note\}/);
  assert.match(reviewPageSource, /format=\{content\.note_format/);
});
