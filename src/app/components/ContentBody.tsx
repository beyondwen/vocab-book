'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

export type ContentFormat = 'plain' | 'markdown';

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const markdownComponents: Components = {
  a: ({ children, href }) => (
    <a
      className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-indigo-200 bg-indigo-50/60 px-4 py-2 text-gray-700">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => (
    <code className={joinClasses('rounded bg-gray-100 px-1 py-0.5 text-[0.9em] text-gray-900', className)}>
      {children}
    </code>
  ),
  h1: ({ children }) => <h1 className="mb-3 text-xl font-bold leading-8 text-gray-950">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-4 text-lg font-semibold leading-7 text-gray-950">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold leading-7 text-gray-950">{children}</h3>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
  p: ({ children }) => <p className="mb-3 leading-7 last:mb-0">{children}</p>,
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-gray-950 p-4 text-sm leading-6 text-gray-50">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  td: ({ children }) => <td className="border border-gray-200 px-3 py-2 align-top">{children}</td>,
  th: ({ children }) => <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold">{children}</th>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
};

export default function ContentBody({
  body,
  format = 'plain',
  className,
}: {
  body: string;
  format?: ContentFormat | null;
  className?: string;
}) {
  if (format !== 'markdown') {
    return <p className={joinClasses('whitespace-pre-wrap', className)}>{body}</p>;
  }

  return (
    <div className={joinClasses('min-w-0 text-gray-800', className)}>
      <ReactMarkdown
        components={markdownComponents}
        rehypePlugins={[rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
