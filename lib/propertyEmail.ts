import type { FetchedProperty } from "@/app/api/fetch-property/route";

/** Build a cinematic, persuasive single-property email. */
export function buildSinglePropertyHtml(p: FetchedProperty, recipientFirstName = "there"): string {
  const address = [p.address, p.city, p.state].filter(Boolean).join(", ");
  const priceStr = p.price
    ? `$${Number(p.price).toLocaleString()}${p.priceType === "month" ? "/mo" : ""}`
    : "Contact for price";

  // Hero image
  const [hero, ...rest] = p.photos.filter(Boolean).slice(0, 5);
  const galleryPhotos = rest.slice(0, 3);

  const heroHtml = hero
    ? `<img src="${hero}" alt="${p.address}" width="600" style="display:block;width:100%;height:340px;object-fit:cover;" />`
    : `<div style="height:280px;background:linear-gradient(160deg,#0B1F3A 0%,#1A56DB 100%);"></div>`;

  // Gallery strip (up to 3 images)
  const galleryHtml = galleryPhotos.length > 0
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:2px;">
  <tr>
    ${galleryPhotos.map(photo => `<td width="${Math.floor(100 / galleryPhotos.length)}%" style="padding-right:${photo !== galleryPhotos[galleryPhotos.length - 1] ? "2px" : "0"};">
      <img src="${photo}" width="100%" alt="Property photo" style="display:block;height:120px;object-fit:cover;" />
    </td>`).join("")}
  </tr>
</table>`
    : "";

  // Pill badges for beds/baths/sqft
  const pillsHtml = [
    p.beds && `<td style="background:#F3F4F6;border-radius:20px;padding:4px 12px;font-size:12px;color:#374151;font-family:'DM Sans',Arial,sans-serif;white-space:nowrap;font-weight:500;">${p.beds} bed</td><td width="8"></td>`,
    p.baths && `<td style="background:#F3F4F6;border-radius:20px;padding:4px 12px;font-size:12px;color:#374151;font-family:'DM Sans',Arial,sans-serif;white-space:nowrap;font-weight:500;">${p.baths} bath</td><td width="8"></td>`,
    p.sqft && `<td style="background:#F3F4F6;border-radius:20px;padding:4px 12px;font-size:12px;color:#374151;font-family:'DM Sans',Arial,sans-serif;white-space:nowrap;font-weight:500;">${Number(p.sqft).toLocaleString()} sqft</td>`,
  ].filter(Boolean);

  const pillsTableHtml = pillsHtml.length > 0
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 0;"><tr>${pillsHtml.join("")}</tr></table>`
    : "";

  // Description
  const descText = p.description && p.description.length > 40
    ? p.description
    : `This ${p.propertyType || "home"} is available now in ${p.city || "your area"}. ` +
      `${p.beds ? p.beds + " bedrooms" : ""}${p.baths ? ", " + p.baths + " bathrooms" : ""}${p.sqft ? " — " + Number(p.sqft).toLocaleString() + " sq ft" : ""}. ` +
      `${p.yearBuilt ? "Built " + p.yearBuilt + ". " : ""}Move-in ready.`;

  // Amenities highlights (up to 6)
  const allFeatures = p.amenities.flatMap(s => s.items).slice(0, 6);
  const featureHtml = allFeatures.length > 0
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  ${allFeatures.map(f => `<tr><td style="padding:5px 0;font-size:14px;color:#374151;font-family:'DM Sans',Arial,sans-serif;border-bottom:1px solid #F3F4F6;">
    <span style="color:#C8A96E;font-weight:700;margin-right:10px;">&#x2014;</span>${f}
  </td></tr>`).join("")}
</table>`
    : "";

  // Details strip
  const details = [
    p.yearBuilt && `Built ${p.yearBuilt}`,
    p.garage && `Parking: ${p.garage}`,
    p.petPolicy && `Pets: ${p.petPolicy}`,
    p.neighborhood && `${p.neighborhood}`,
  ].filter(Boolean);

  return `
<!-- Hero image block -->
<div style="margin:0 -48px;">
  ${heroHtml}
  ${galleryHtml}
</div>

<!-- Price + address -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;">
  <tr>
    <td>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:700;color:#0B1F3A;line-height:1;letter-spacing:-0.5px;">${priceStr}</p>
      <p style="margin:8px 0 0;font-size:15px;color:#6B7280;font-family:'DM Sans',Arial,sans-serif;font-weight:400;">${address}</p>
      ${pillsTableHtml}
    </td>
  </tr>
</table>

<!-- Gold separator -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="background-color:#C8A96E;height:1px;line-height:1px;font-size:1px;">&nbsp;</td>
  </tr>
</table>

<!-- Salutation + description -->
<p style="margin:0;font-size:16px;color:#111827;font-family:'DM Sans',Arial,sans-serif;line-height:1.8;">Hi ${recipientFirstName},</p>
<p style="margin:12px 0 0;font-size:15px;color:#374151;font-family:'DM Sans',Arial,sans-serif;line-height:1.85;">
  This one just came available. ${descText}
</p>

<!-- Amenity list -->
${featureHtml}

<!-- Property details chips -->
${details.length > 0 ? `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#FAFAFA;border-radius:8px;">
  <tr>
    <td style="padding:20px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${details.map(d => `<tr><td style="padding:3px 0;font-size:13px;color:#4B5563;font-family:'DM Sans',Arial,sans-serif;">${d}</td></tr>`).join("")}
      </table>
    </td>
  </tr>
</table>
` : ""}

<!-- Urgency line -->
<p style="margin:28px 0 8px;font-size:15px;color:#111827;font-family:'DM Sans',Arial,sans-serif;line-height:1.8;font-weight:600;">
  Properties like this move fast.
</p>
<p style="margin:0 0 28px;font-size:15px;color:#374151;font-family:'DM Sans',Arial,sans-serif;line-height:1.8;">
  View the full listing, photos, and apply — takes minutes.
</p>

<!-- CTA Button — full width, bold -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
  <tr>
    <td align="center" style="background-color:#0B1F3A;border-radius:6px;">
      <a href="${p.applyUrl || "https://haskerrealtygroup.com/properties"}"
         style="display:block;padding:16px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.06em;text-transform:uppercase;font-family:'DM Sans',Arial,sans-serif;">
        View Listing &amp; Apply
      </a>
    </td>
  </tr>
</table>

${p.virtualTourUrl ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
  <tr>
    <td align="center" style="border:1px solid #E5E7EB;border-radius:6px;">
      <a href="${p.virtualTourUrl}"
         style="display:block;padding:14px 32px;font-size:13px;font-weight:600;color:#374151;text-decoration:none;letter-spacing:0.04em;font-family:'DM Sans',Arial,sans-serif;">
        Take a Virtual Tour
      </a>
    </td>
  </tr>
</table>` : ""}

<!-- Sign-off -->
<p style="margin:36px 0 0;font-size:14px;color:#6B7280;font-family:'DM Sans',Arial,sans-serif;line-height:1.75;">
  Reply to this email or call us to schedule a showing. We're here.
</p>
<p style="margin:8px 0 0;font-size:14px;color:#111827;font-weight:600;font-family:'DM Sans',Arial,sans-serif;">
  The Hasker &amp; Co. Team
</p>
`.trim();
}

/** Build a showcase email for multiple properties. */
export function buildMultiPropertyHtml(properties: FetchedProperty[], title: string): string {
  const intro = `<p style="font-size:15px;color:#374151;margin:0 0 32px;line-height:1.85;font-family:'DM Sans',Arial,sans-serif;">These are the best homes available right now. Move-in ready, honestly priced. Let us know if any catch your eye.</p>`;

  const cards = properties.map((p) => {
    const photo = p.photos[0] ?? "";
    const address = [p.address, p.city, p.state].filter(Boolean).join(", ");
    const meta = [
      p.beds && `${p.beds} bed`,
      p.baths && `${p.baths} bath`,
      p.sqft && `${Number(p.sqft).toLocaleString()} sqft`,
    ].filter(Boolean).join(" &nbsp;&middot;&nbsp; ");
    const features = p.amenities.flatMap(s => s.items).slice(0, 3);

    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;background:#ffffff;">
  <tr>
    <td>${photo ? `<img src="${photo}" alt="${p.address}" width="600" style="display:block;width:100%;height:200px;object-fit:cover;" />` : `<div style="height:140px;background:#F3F4F6;"></div>`}</td>
  </tr>
  <tr>
    <td style="padding:24px 28px 28px;">
      <p style="margin:0 0 5px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#0B1F3A;letter-spacing:-0.3px;">
        ${p.price ? `$${Number(p.price).toLocaleString()}${p.priceType === "month" ? `<span style="font-size:15px;font-weight:400;color:#9CA3AF;font-family:'DM Sans',Arial,sans-serif;"> /mo</span>` : ""}` : "Contact for price"}
      </p>
      <p style="margin:0 0 8px;font-size:14px;color:#374151;font-family:'DM Sans',Arial,sans-serif;font-weight:400;">${address}</p>
      ${meta ? `<p style="margin:0 0 16px;font-size:12px;color:#9CA3AF;font-family:'DM Sans',Arial,sans-serif;">${meta}</p>` : ""}
      ${features.length > 0 ? `<p style="margin:0 0 20px;font-size:12px;color:#6B7280;font-family:'DM Sans',Arial,sans-serif;">&#x2014;&nbsp; ${features.join(" &nbsp;&nbsp;&#x2014;&nbsp; ")}</p>` : ""}
      ${p.petPolicy ? `<p style="margin:0 0 20px;font-size:12px;color:#059669;background:#ECFDF5;padding:5px 12px;border-radius:20px;display:inline-block;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">${p.petPolicy}</p>` : ""}
      <a href="${p.applyUrl || "https://haskerrealtygroup.com/properties"}"
         style="display:inline-block;padding:11px 24px;background:#0B1F3A;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;border-radius:5px;letter-spacing:0.08em;text-transform:uppercase;font-family:'DM Sans',Arial,sans-serif;">
        View &amp; Apply
      </a>
      ${p.virtualTourUrl ? `&nbsp;<a href="${p.virtualTourUrl}" style="display:inline-block;padding:11px 20px;background:#F3F4F6;color:#374151;font-size:12px;font-weight:600;text-decoration:none;border-radius:5px;font-family:'DM Sans',Arial,sans-serif;">Virtual Tour</a>` : ""}
    </td>
  </tr>
</table>`.trim();
  });

  return `
<p style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#0B1F3A;margin:0 0 10px;font-weight:700;letter-spacing:-0.3px;">${title}</p>
${intro}
${cards.join("\n")}
<p style="font-size:13px;color:#9CA3AF;margin:28px 0 0;line-height:1.75;font-family:'DM Sans',Arial,sans-serif;">Questions about any of these homes? Reply to this email or call us.</p>`.trim();
}
