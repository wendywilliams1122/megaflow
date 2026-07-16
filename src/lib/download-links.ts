import { z } from "zod";

export type DownloadLink = { label: string; url: string };

const MAX_DOWNLOAD_URL_LENGTH = 2048;

const downloadUrlSchema = z
  .string()
  .trim()
  .min(1, "Download link enter karo.")
  .max(MAX_DOWNLOAD_URL_LENGTH, "Download link bohat lamba hai.")
  .refine((value) => !/\s/.test(value), "Download link main spaces nahi honi chahiye.")
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }, "Yahan sirf valid link enter karo, jaise https://example.com/file.zip");

export function validateDownloadUrl(value: string) {
  return downloadUrlSchema.safeParse(value);
}

export function isValidDownloadUrl(value: string) {
  return validateDownloadUrl(value).success;
}

export function splitDownloadUrlInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeDownloadLinks(downloads: DownloadLink[]): string {
  return downloads
    .filter((d) => isValidDownloadUrl(d.url))
    .map(
      (d) =>
        `[download url="${d.url.replace(/"/g, "&quot;")}" label="${(d.label || "Download").replace(/"/g, "&quot;")}"]`,
    )
    .join("\n");
}
