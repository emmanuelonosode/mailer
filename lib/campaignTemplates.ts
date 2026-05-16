export interface CampaignTemplate {
  id: string;
  name: string;
  category: "listing" | "retention" | "promo" | "followup";
  description: string;
  icon: string; // emoji
  subjectLines: string[];
  bodyHtml: string;
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "new-listing",
    name: "New Listing Alert",
    category: "listing",
    icon: "🏠",
    description: "Announce a newly available property to prospective tenants or buyers.",
    subjectLines: [
      "[X] bed in [City] - just listed",
      "New in [City]: $[Price]/mo - move-in ready",
      "{{name}}, a home just opened up near you",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<p>This one just listed. It checks a lot of boxes - take a look before someone else does.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:24px 0;">
  <tr>
    <td style="padding:0;">
      <img src="https://haskerrealtygroup.com/images/placeholder-home.jpg" alt="Property photo" width="520" style="width:100%;height:200px;object-fit:cover;display:block;" />
    </td>
  </tr>
  <tr>
    <td style="padding:20px;">
      <p style="font-size:22px;font-weight:700;color:#0B1F3A;margin:0 0 4px 0;">$[PRICE]/mo</p>
      <p style="font-size:13px;color:#374151;margin:0 0 14px 0;">[ADDRESS] &nbsp;&middot;&nbsp; [CITY], [STATE]</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
        <tr>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[BEDS] bed</td>
          <td width="6"></td>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[BATHS] bath</td>
          <td width="6"></td>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[SQFT] sqft</td>
        </tr>
      </table>
      <a href="[LISTING_URL]" style="display:inline-block;padding:10px 22px;background:#1A56DB;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;">View Listing</a>
    </td>
  </tr>
</table>

<p>Same-day showings available. Application processed in 24-48 hours. No hidden fees.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#0B1F3A;border-radius:6px;padding:12px 28px;">
      <a href="[CTA_URL]" style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">Schedule a Showing</a>
    </td>
  </tr>
</table>

<p>Browse all available homes at <a href="https://haskerrealtygroup.com/properties">haskerrealtygroup.com/properties</a>.</p>

<p style="margin-top:24px;">Talk soon,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },

  {
    id: "price-drop",
    name: "Price Drop Alert",
    category: "listing",
    icon: "📉",
    description: "Notify leads of a price reduction on a property they may have passed on.",
    subjectLines: [
      "Price drop: [City] listing now $[Price]/mo",
      "We cut the price - take another look",
      "$[SAVINGS] off. [City] listing - still available",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<p>The price just dropped on this one. If you passed on it before, now's the time to reconsider.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:24px 0;">
  <tr>
    <td style="padding:0;">
      <img src="https://haskerrealtygroup.com/images/placeholder-home.jpg" alt="Property photo" width="520" style="width:100%;height:200px;object-fit:cover;display:block;" />
    </td>
  </tr>
  <tr>
    <td style="padding:20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
        <tr>
          <td style="font-size:13px;color:#9ca3af;text-decoration:line-through;padding-right:10px;">Was $[OLD_PRICE]/mo</td>
          <td style="font-size:22px;font-weight:700;color:#1A56DB;">$[NEW_PRICE]/mo</td>
        </tr>
      </table>
      <p style="font-size:13px;color:#374151;margin:0 0 14px 0;">[ADDRESS] &nbsp;&middot;&nbsp; [CITY], [STATE]</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
        <tr>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[BEDS] bed</td>
          <td width="6"></td>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[BATHS] bath</td>
          <td width="6"></td>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[SQFT] sqft</td>
        </tr>
      </table>
      <a href="[LISTING_URL]" style="display:inline-block;padding:10px 22px;background:#1A56DB;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;">View Updated Listing</a>
    </td>
  </tr>
</table>

<p>This is the lowest this home has been priced. Same-day showings are available - reply to this email and we will get you in.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#0B1F3A;border-radius:6px;padding:12px 28px;">
      <a href="[CTA_URL]" style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">Book a Showing Today</a>
    </td>
  </tr>
</table>

<p style="margin-top:24px;">Talk soon,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },

  {
    id: "city-spotlight",
    name: "City Spotlight",
    category: "listing",
    icon: "🏙️",
    description: "Showcase multiple available listings in a single city to targeted prospects.",
    subjectLines: [
      "Best homes in [City] this week",
      "{{name}}, here's what's available in [City] right now",
      "[City] listings: move-in ready, honest prices",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<p>Here are the best homes available in <strong>[CITY]</strong> this week. Move-in ready. Honestly priced.</p>

<!-- Listing 1 -->
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:20px 0;">
  <tr>
    <td style="padding:20px;">
      <p style="font-size:18px;font-weight:700;color:#0B1F3A;margin:0 0 4px 0;">$[PRICE_1]/mo</p>
      <p style="font-size:13px;color:#374151;margin:0 0 10px 0;">[ADDRESS_1] &nbsp;&middot;&nbsp; [CITY], [STATE]</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[BEDS_1] bed</td>
          <td width="6"></td>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[BATHS_1] bath</td>
          <td width="6"></td>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[SQFT_1] sqft</td>
        </tr>
      </table>
      <a href="[URL_1]" style="font-size:13px;color:#1A56DB;text-decoration:none;font-weight:600;">View Listing</a>
    </td>
  </tr>
</table>

<!-- Listing 2 -->
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 20px 0;">
  <tr>
    <td style="padding:20px;">
      <p style="font-size:18px;font-weight:700;color:#0B1F3A;margin:0 0 4px 0;">$[PRICE_2]/mo</p>
      <p style="font-size:13px;color:#374151;margin:0 0 10px 0;">[ADDRESS_2] &nbsp;&middot;&nbsp; [CITY], [STATE]</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[BEDS_2] bed</td>
          <td width="6"></td>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[BATHS_2] bath</td>
          <td width="6"></td>
          <td style="border:1px solid #0B1F3A;border-radius:4px;padding:2px 8px;font-size:11px;color:#0B1F3A;font-family:Arial,sans-serif;white-space:nowrap;">[SQFT_2] sqft</td>
        </tr>
      </table>
      <a href="[URL_2]" style="font-size:13px;color:#1A56DB;text-decoration:none;font-weight:600;">View Listing</a>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#0B1F3A;border-radius:6px;padding:12px 28px;">
      <a href="https://haskerrealtygroup.com/properties" style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">See All [City] Homes</a>
    </td>
  </tr>
</table>

<p>Kids, pets, extended family - we work with you. 2,000+ families housed across 12+ cities.</p>

<p style="margin-top:24px;">Talk soon,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },

  {
    id: "apply-reminder",
    name: "Application Reminder",
    category: "followup",
    icon: "📋",
    description: "Nudge warm leads who showed interest but haven't submitted an application.",
    subjectLines: [
      "One step left, {{name}}",
      "Your application is waiting",
      "Don't lose your spot - apply today",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<p>You're one step away from your new home. The spot is still open - but it won't stay that way.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-left:3px solid #1A56DB;background:#f8faff;margin:20px 0;padding:0;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="font-size:15px;font-weight:700;color:#0B1F3A;margin:0 0 4px 0;">[ADDRESS]</p>
      <p style="font-size:13px;color:#374151;margin:0 0 6px 0;">[CITY], [STATE] &nbsp;&middot;&nbsp; $[PRICE]/mo</p>
      <p style="font-size:12px;color:#6b7280;margin:0;">[BEDS] bed &nbsp;&middot;&nbsp; [BATHS] bath &nbsp;&middot;&nbsp; [SQFT] sqft</p>
    </td>
  </tr>
</table>

<p>Here's how fast it goes:</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:6px 0;font-size:13px;color:#374151;">Apply online in minutes</td>
  </tr>
  <tr>
    <td style="padding:6px 0;font-size:13px;color:#374151;">Decision within 24-48 hours</td>
  </tr>
  <tr>
    <td style="padding:6px 0;font-size:13px;color:#374151;">Digital lease signing - no trips required</td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="background:#1A56DB;border-radius:6px;padding:13px 30px;">
      <a href="[APPLY_URL]" style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">Complete My Application</a>
    </td>
  </tr>
</table>

<p>Questions? Just reply to this email. We'll help you get across the finish line.</p>

<p style="margin-top:24px;">Talk soon,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },

  {
    id: "move-in-special",
    name: "Move-In Special",
    category: "promo",
    icon: "🎁",
    description: "Promote a limited-time offer like a deposit waiver or first month free.",
    subjectLines: [
      "[OFFER_HEADLINE] - available now in [City]",
      "Move in this month, save $[SAVINGS]",
      "{{name}}, this offer expires [DEADLINE]",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<!-- Promo banner -->
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#0B1F3A;border-radius:10px;margin:16px 0 24px 0;">
  <tr>
    <td align="center" style="padding:28px 32px;">
      <p style="font-size:11px;color:#93c5fd;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px 0;">Limited Time</p>
      <p style="font-size:26px;font-weight:800;color:#ffffff;margin:0 0 6px 0;">[OFFER_HEADLINE]</p>
      <p style="font-size:13px;color:#93c5fd;margin:0;">e.g. First month free &nbsp;&middot;&nbsp; No security deposit &nbsp;&middot;&nbsp; Waived application fee</p>
    </td>
  </tr>
</table>

<p>Sign a lease by <strong>[DEADLINE]</strong> on any qualifying home in <strong>[CITY]</strong> and this offer is yours.</p>

<p style="font-size:13px;color:#6b7280;">Terms: [TERMS_DETAILS]. Subject to availability. Reply for qualifying homes.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="background:#1A56DB;border-radius:6px;padding:12px 28px;">
      <a href="https://haskerrealtygroup.com/properties" style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">Browse Qualifying Homes</a>
    </td>
  </tr>
</table>

<p>Same-day showings available. We'll get you in, answer every question, and make this easy.</p>

<p style="margin-top:24px;">Talk soon,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },

  {
    id: "re-engagement",
    name: "Re-Engagement",
    category: "retention",
    icon: "💬",
    description: "Win back leads who went cold — new inventory, prices, and a personal touch.",
    subjectLines: [
      "New homes in [City] - take a look",
      "{{name}}, a lot has changed since we last spoke",
      "Still searching? We have [LISTING_COUNT]+ homes available",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<p>A lot has changed. New homes, updated prices across <strong>[CITY]</strong> and beyond. Here's what we're still doing every day:</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr><td style="padding:5px 0;font-size:13px;color:#374151;">Well-maintained homes, move-in ready</td></tr>
  <tr><td style="padding:5px 0;font-size:13px;color:#374151;">Same-day showings, 24-48hr decisions</td></tr>
  <tr><td style="padding:5px 0;font-size:13px;color:#374151;">Kids, pets, extended family - we work with you</td></tr>
  <tr><td style="padding:5px 0;font-size:13px;color:#374151;">Honest prices, no hidden fees</td></tr>
</table>

<p>We have <strong>[LISTING_COUNT]+</strong> homes available right now across <strong>12+ cities</strong>. Prices from under $800 to $3,500+/month.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="background:#0B1F3A;border-radius:6px;padding:12px 28px;">
      <a href="https://haskerrealtygroup.com/properties" style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">See What's Available</a>
    </td>
  </tr>
</table>

<p>If the timing isn't right, no problem - just reply and let us know. We're here when you're ready.</p>

<p style="margin-top:24px;">Talk soon,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },
];
