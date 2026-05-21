export function normalizeContentBody(value: unknown): string;
export function normalizeContentId(value: unknown): number;
export function normalizeContentFormat(value: unknown, fieldLabel?: string): 'plain' | 'markdown';
export function parseTags(value: unknown): string[];
export function normalizeWordIds(value: unknown): number[];
export function normalizeContentPayload(value: unknown): {
  body: string;
  format: 'plain' | 'markdown';
  source: string | null;
  note: string | null;
  noteFormat: 'plain' | 'markdown';
  tags: string[];
  wordIds: number[];
};
