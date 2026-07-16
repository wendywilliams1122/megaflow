import DOMPurify from "dompurify";
import { DownloadList, type DownloadItem } from "@/components/DownloadButton";
import { Spoiler } from "@/components/Spoiler";
import { isValidDownloadUrl } from "@/lib/download-links";

// Extracts [download url="..." label="..."] shortcodes from the text/HTML and
// returns the cleaned body plus a list of downloads. Also supports legacy
// [spoiler]...[/spoiler] plaintext (falls back to gated render).
function extractDownloads(input: string): { body: string; downloads: DownloadItem[] } {
  const downloads: DownloadItem[] = [];
  const re = /\[download\s+url=["']([^"']+)["'](?:\s+label=["']([^"']*)["'])?\s*\]/gi;
  let body = input.replace(re, (_m, url, label) => {
    const cleanUrl = String(url).trim();
    if (isValidDownloadUrl(cleanUrl)) {
      downloads.push({ url: cleanUrl, label: String(label ?? "").trim() || "Download" });
    }
    return "";
  });
  // Public-body placeholder markers (for signed-out / ineligible viewers)
  body = body.replace(/\[download-locked\]/gi, () => {
    downloads.push({ url: "", label: "Locked resource" });
    return "";
  });
  return { body, downloads };
}


function looksLikeHtml(s: string) {
  return /<[a-z][\s\S]*>/i.test(s);
}

export function RichBody({ text, className }: { text: string; className?: string }) {
  const { body: rawBody, downloads } = extractDownloads(text ?? "");
  // Count and strip locked-spoiler markers so we can render placeholder Spoiler notices.
  const lockedSpoilers = (rawBody.match(/\[spoiler-locked\]/gi) ?? []).length;
  const body = rawBody.replace(/\[spoiler-locked\]/gi, "");

  const lockedSpoilerBlocks = lockedSpoilers > 0
    ? Array.from({ length: lockedSpoilers }).map((_, i) => (
        <Spoiler key={`ls-${i}`}><span /></Spoiler>
      ))
    : null;

  // Legacy plain-text spoilers: render inline (still gated).
  if (!looksLikeHtml(body) && /\[spoiler\]/i.test(body)) {
    const parts: React.ReactNode[] = [];
    const re = /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi;
    let last = 0, k = 0, m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      if (m.index > last) parts.push(<span key={k++} className="whitespace-pre-wrap">{body.slice(last, m.index)}</span>);
      parts.push(<Spoiler key={k++}><div className="whitespace-pre-wrap">{m[1]}</div></Spoiler>);
      last = m.index + m[0].length;
    }
    if (last < body.length) parts.push(<span key={k++} className="whitespace-pre-wrap">{body.slice(last)}</span>);
    return (
      <div className={className}>
        <div>{parts}</div>
        {lockedSpoilerBlocks}
        <DownloadList items={downloads} />
      </div>
    );
  }

  if (looksLikeHtml(body)) {
    const clean = DOMPurify.sanitize(body, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "target", "rel"],
    });
    return (
      <div className={className}>
        <div className="tiptap prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: clean }} />
        {lockedSpoilerBlocks}
        <DownloadList items={downloads} />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="whitespace-pre-wrap">{body}</div>
      {lockedSpoilerBlocks}
      <DownloadList items={downloads} />
    </div>
  );
}

