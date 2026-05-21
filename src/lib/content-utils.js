export function normalizeContentBody(value) {
  const body = typeof value === 'string' ? value.trim() : '';
  if (!body) {
    throw new Error('内容正文不能为空');
  }
  return body;
}

export function parseTags(value) {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,，]/)
      : [];

  return Array.from(
    new Set(
      rawTags
        .map((tag) => String(tag).trim())
        .filter(Boolean),
    ),
  );
}

export function normalizeWordIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );
}

export function normalizeContentId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('内容 ID 无效');
  }
  return id;
}

export function normalizeContentFormat(value, fieldLabel = '内容格式') {
  const format = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!format) {
    return 'plain';
  }
  if (format === 'plain' || format === 'markdown') {
    return format;
  }
  throw new Error(`${fieldLabel}只支持 plain 或 markdown`);
}

export function normalizeContentPayload(value) {
  const payload = value && typeof value === 'object' ? value : {};

  return {
    body: normalizeContentBody(payload.body),
    format: normalizeContentFormat(payload.format, '内容格式'),
    source: payload.source ? String(payload.source).trim() : null,
    note: payload.note ? String(payload.note).trim() : null,
    noteFormat: normalizeContentFormat(payload.note_format, '备注格式'),
    tags: parseTags(payload.tags),
    wordIds: normalizeWordIds(payload.word_ids),
  };
}
