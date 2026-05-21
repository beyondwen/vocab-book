import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeContentPayload,
  normalizeContentBody,
  normalizeContentId,
  normalizeWordIds,
  parseTags,
} from '../src/lib/content-utils.js';

test('normalizeContentBody trims content and rejects empty body', () => {
  assert.equal(normalizeContentBody('  Fame is ephemeral.  '), 'Fame is ephemeral.');
  assert.throws(
    () => normalizeContentBody(' \n\t '),
    /内容正文不能为空/,
  );
});

test('parseTags accepts comma separated strings and arrays', () => {
  assert.deepEqual(parseTags('阅读, GRE, 阅读,  '), ['阅读', 'GRE']);
  assert.deepEqual(parseTags(['  影视 ', '阅读', '', '影视']), ['影视', '阅读']);
  assert.deepEqual(parseTags(null), []);
});

test('normalizeWordIds keeps positive integer ids once', () => {
  assert.deepEqual(normalizeWordIds([3, '2', 3, 'bad', 0, -1, 2.5, '4']), [3, 2, 4]);
  assert.deepEqual(normalizeWordIds(undefined), []);
});

test('normalizeContentId accepts positive integer ids only', () => {
  assert.equal(normalizeContentId('42'), 42);
  assert.throws(() => normalizeContentId('0'), /内容 ID 无效/);
  assert.throws(() => normalizeContentId('abc'), /内容 ID 无效/);
});

test('normalizeContentPayload prepares external API content payload', () => {
  assert.deepEqual(
    normalizeContentPayload({
      body: '  Fame is ephemeral.  ',
      source: '  article  ',
      note: '  useful sentence  ',
      tags: '阅读, 例句, 阅读',
      word_ids: [1, '2', 1],
    }),
    {
      body: 'Fame is ephemeral.',
      source: 'article',
      note: 'useful sentence',
      tags: ['阅读', '例句'],
      wordIds: [1, 2],
    },
  );
});
