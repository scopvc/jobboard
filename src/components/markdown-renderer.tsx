import ReactMarkdown from "react-markdown";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-gray max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-h2:text-lg prose-h3:text-base prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-black prose-a:no-underline hover:prose-a:text-gray-600">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
