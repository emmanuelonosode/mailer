export function injectTracking(
  html: string,
  sendId: string,
  recipientEmail: string,
  appUrl: string,
  campaignId?: string
): string {
  const r = encodeURIComponent(recipientEmail);
  const s = encodeURIComponent(sendId);
  const cid = campaignId ? encodeURIComponent(campaignId) : "";

  let result = html.replace(/href="([^"]+)"/gi, (_, url: string) => {
    if (
      url.startsWith("mailto:") ||
      url.startsWith("#") ||
      url.includes("/unsubscribe") ||
      url.includes("/api/track")
    ) {
      return `href="${url}"`;
    }
    const clickUrl = `${appUrl}/api/track?type=click&send=${s}&r=${r}&url=${encodeURIComponent(url)}${cid ? `&cid=${cid}` : ""}`;
    return `href="${clickUrl}"`;
  });

  const pixelUrl = `${appUrl}/api/track?type=open&send=${s}&r=${r}${cid ? `&cid=${cid}` : ""}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;margin:0;padding:0;" alt="" />`;

  if (result.includes("</body>")) {
    result = result.replace("</body>", `${pixel}</body>`);
  } else {
    result += pixel;
  }

  return result;
}
