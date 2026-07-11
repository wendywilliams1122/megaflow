import { Fragment } from "react";
import { Spoiler } from "@/components/Spoiler";

/**
 * Renders text with support for [spoiler]...[/spoiler] tags.
 * Content inside spoilers is only visible to eligible users
 * (10+ day-old members who have created at least one thread).
 */
export function RichBody({ text, className }: { text: string; className?: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > lastIndex) {
      parts.push(
        <span key={`t-${key++}`} className="whitespace-pre-wrap">
          {text.slice(lastIndex, m.index)}
        </span>,
      );
    }
    parts.push(
      <Spoiler key={`s-${key++}`}>
        <div className="whitespace-pre-wrap">{m[1]}</div>
      </Spoiler>,
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(
      <span key={`t-${key++}`} className="whitespace-pre-wrap">
        {text.slice(lastIndex)}
      </span>,
    );
  }
  if (parts.length === 0) parts.push(<span key="empty" className="whitespace-pre-wrap">{text}</span>);
  return <div className={className}>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</div>;
}
