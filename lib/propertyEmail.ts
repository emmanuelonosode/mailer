import type { FetchedProperty } from "@/app/api/fetch-property/route";

/** Build a cinematic, persuasive single-property email. */
export function buildSinglePropertyHtml(p: FetchedProperty, recipientFirstName = "there"): string {
  const address = [p.address, p.city, p.state].filter(Boolean).join(", ");
  const priceStr = p.price
    ? `$${Number(p.price).toLocaleString()}${p.priceType === "month" ? "/mo" : ""}`
    : "Contact for price";
  const meta = [
    p.beds && `${p.beds} Bedrooms`,
    p.baths && `${p.baths} Bathrooms`,
    p.sqft && `${Number(p.sqft).toLocaleString()} sq ft`,
  ].filter(Boolean);

  // Hero image + gallery row (up to 4 images)
  const [hero, ...rest] = p.photos.filter(Boolean).slice(0, 5);
  const galleryPhotos = rest.slice(0, 4);

  const heroHtml = hero
    ? `<img src="${hero}" alt="${p.address}" width="100%" style="display:block;width:100%;height:320px;object-fit:cover;border-radius:12px 12px 0 0;" />`
    : `<div style="height:240px;background:linear-gradient(135deg,#0B1F3A,#1A56DB);border-radius:12px 12px 0 0;"></div>`;

  // Gallery strip
  const galleryHtml = galleryPhotos.length > 0
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:3px;">
  <tr>
    ${galleryPhotos.map(photo => `<td width="${Math.floor(100 / galleryPhotos.length)}%" style="padding-right:3px;">
      <img src="${photo}" width="100%" alt="Property photo" style="display:block;height:100px;object-fit:cover;" />
    </td>`).join("")}
  </tr>
</table>`
    : "";

  // Features bullet list
  const allFeatures = p.amenities.flatMap(s => s.items).slice(0, 8);
  const featureHtml = allFeatures.length > 0
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  ${allFeatures.map(f => `<tr><td style="padding:3px 0;font-size:14px;color:#374151;">✓&nbsp;&nbsp;${f}</td></tr>`).join("")}
</table>`
    : "";

  // Persuasive description — use scraped description or generate from data
  const descText = p.description && p.description.length > 40
    ? p.description
    : `This stunning ${p.propertyType || "home"} is now available in ${p.city || "your area"}. ` +
      `Featuring ${p.beds ? p.beds + " spacious bedrooms" : "generous living spaces"}${p.baths ? " and " + p.baths + " bathrooms" : ""}, ` +
      `this property ${p.sqft ? "spans " + Number(p.sqft).toLocaleString() + " sq ft and " : ""}offers everything you need to feel at home. ` +
      `${p.yearBuilt ? "Built in " + p.yearBuilt + ", it blends" : "It blends"} comfort, style, and convenience in one exceptional package.`;

  // Neighborhood / extras
  const extras = [
    p.garage && `🚗 ${p.garage}`,
    p.yearBuilt && `🏗 Built ${p.yearBuilt}`,
    p.petPolicy && `🐾 ${p.petPolicy}`,
    p.neighborhood && `📍 ${p.neighborhood}`,
  ].filter(Boolean);

  return `
<!-- Hero image -->
<div style="border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12);">
  ${heroHtml}
  ${galleryHtml}
</div>

<!-- Price badge -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
  <tr>
    <td>
      <p style="margin:0;font-family:Georgia,serif;font-size:32px;font-weight:700;color:#0B1F3A;line-height:1;">${priceStr}</p>
      <p style="margin:6px 0 0;font-size:16px;color:#374151;font-weight:500;">${address}</p>
      ${meta.length > 0 ? `<p style="margin:6px 0 0;font-size:14px;color:#6b7280;">${meta.join(" &nbsp;·&nbsp; ")}</p>` : ""}
    </td>
  </tr>
</table>

<!-- Salutation -->
<p style="margin:28px 0 0;font-size:16px;color:#374151;line-height:1.7;">Hi ${recipientFirstName},</p>
<p style="margin:12px 0 0;font-size:16px;color:#374151;line-height:1.7;">
  We came across a property we thought you'd love — and we had to send it over right away.
</p>

<!-- Description -->
<p style="margin:16px 0 0;font-size:15px;color:#374151;line-height:1.8;">${descText}</p>

<!-- Why you'll love it -->
${featureHtml.length > 0 ? `
<p style="margin:24px 0 8px;font-size:15px;font-weight:700;color:#0B1F3A;">Why you'll love it:</p>
${featureHtml}
` : ""}

<!-- Extras row -->
${extras.length > 0 ? `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f8fafc;border-radius:8px;padding:16px;">
  <tr>
    <td style="padding:16px;">
      ${extras.map(e => `<p style="margin:0 0 6px;font-size:13px;color:#374151;">${e}</p>`).join("")}
    </td>
  </tr>
</table>
` : ""}

<!-- Urgency + CTA -->
<p style="margin:24px 0 0;font-size:15px;color:#374151;line-height:1.8;">
  Properties like this <strong>don't stay available for long</strong>. If this sounds like the home you've been looking for, we'd love to help you take the next step.
</p>
<p style="margin:8px 0 24px;font-size:15px;color:#374151;line-height:1.8;">
  Click below to view the full listing, photos, and apply — all in just a few minutes.
</p>

<!-- CTA Button -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
  <tr>
    <td style="border-radius:8px;background:#1A56DB;">
      <a href="${p.applyUrl || "https://haskerrealtygroup.com/properties"}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
        View Full Listing &amp; Apply →
      </a>
    </td>
  </tr>
</table>
${p.virtualTourUrl ? `<p style="margin:12px 0 0;"><a href="${p.virtualTourUrl}" style="font-size:13px;color:#1A56DB;text-decoration:underline;">🎥 Take a Virtual Tour</a></p>` : ""}

<p style="margin:32px 0 0;font-size:14px;color:#6b7280;line-height:1.7;">
  Have questions? Simply reply to this email or call us — we're happy to schedule a showing or answer anything about this property.
</p>
<p style="margin:12px 0 0;font-size:14px;color:#374151;font-weight:600;">Warm regards,<br/>The Hasker &amp; Co. Realty Team</p>
`.trim();
}

/** Build a showcase email for multiple properties. */
export function buildMultiPropertyHtml(properties: FetchedProperty[], title: string): string {
  const intro = `<p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.8;">We've handpicked some of the best available homes right now. Each one is move-in ready — take a look and let us know if anything catches your eye.</p>`;

  const cards = properties.map((p) => {
    const photo = p.photos[0] ?? "";
    const address = [p.address, p.city, p.state].filter(Boolean).join(", ");
    const meta = [p.beds && `${p.beds} bd`, p.baths && `${p.baths} ba`, p.sqft && `${Number(p.sqft).toLocaleString()} sf`].filter(Boolean).join(" · ");
    const features = p.amenities.flatMap(s => s.items).slice(0, 3);

    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#fff;">
  <tr>
    <td>${photo ? `<img src="${photo}" alt="${p.address}" width="100%" style="display:block;height:220px;object-fit:cover;" />` : `<div style="height:160px;background:#f3f4f6;"></div>`}</td>
  </tr>
  <tr>
    <td style="padding:20px 24px 24px;">
      <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#0B1F3A;">
        ${p.price ? `$${Number(p.price).toLocaleString()}${p.priceType === "month" ? "<span style='font-size:14px;font-weight:400;color:#6b7280;'>/mo</span>" : ""}` : "Contact for price"}
      </p>
      <p style="margin:0 0 4px;font-size:14px;color:#374151;font-weight:500;">${address}</p>
      ${meta ? `<p style="margin:0 0 12px;font-size:13px;color:#6b7280;">${meta}</p>` : ""}
      ${features.length > 0 ? `<p style="margin:0 0 16px;font-size:12px;color:#6b7280;">✓ ${features.join(" &nbsp;·&nbsp; ✓ ")}</p>` : ""}
      ${p.petPolicy ? `<p style="margin:0 0 16px;font-size:12px;color:#059669;background:#ecfdf5;padding:6px 10px;border-radius:4px;display:inline-block;">${p.petPolicy}</p>` : ""}
      <a href="${p.applyUrl || "https://haskerrealtygroup.com/properties"}" style="display:inline-block;padding:10px 24px;background:#1A56DB;color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">
        View &amp; Apply →
      </a>
      ${p.virtualTourUrl ? `&nbsp;<a href="${p.virtualTourUrl}" style="display:inline-block;padding:10px 20px;background:#f3f4f6;color:#374151;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">Virtual Tour</a>` : ""}
    </td>
  </tr>
</table>`.trim();
  });

  return `
<h2 style="font-family:Georgia,serif;font-size:22px;color:#0B1F3A;margin:0 0 8px;font-weight:700;">${title}</h2>
${intro}
${cards.join("\n")}
<p style="font-size:13px;color:#6b7280;margin:24px 0 0;line-height:1.7;">Questions about any of these homes? Reply to this email or call us — we'd love to help you find the right fit.</p>`.trim();
}
