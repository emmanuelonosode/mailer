import { convert } from "html-to-text";

export function convertToPlainText(html: string): string {
  return convert(html, {
    wordwrap: 80,
    selectors: [
      { selector: "a", options: { baseUrl: "https://haskerrealty.com" } },
      { selector: "img", format: "skip" },
      { selector: "h1", options: { uppercase: false } },
      { selector: "h2", options: { uppercase: false } },
      { selector: "h3", options: { uppercase: false } },
    ],
  });
}
