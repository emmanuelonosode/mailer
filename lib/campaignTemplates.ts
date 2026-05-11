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
      "New listing in [City] — move-in ready this weekend",
      "{{name}}, a home just opened up in your area",
      "Just listed: [X] bed in [City] at $[Price]/mo",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<p>We have a new listing that just hit the market — and based on what you've been looking for, we think this one checks a lot of boxes.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:24px 0;">
  <tr>
    <td style="padding:0;">
      <img src="https://haskerrealtygroup.com/images/placeholder-home.jpg" alt="Property photo" width="520" style="width:100%;height:200px;object-fit:cover;display:block;" />
    </td>
  </tr>
  <tr>
    <td style="padding:20px;">
      <p style="font-size:22px;font-weight:700;color:#0B1F3A;margin:0 0 4px 0;">$[PRICE]/mo</p>
      <p style="font-size:13px;color:#374151;margin:0 0 14px 0;">[ADDRESS] &nbsp;·&nbsp; [CITY], [STATE]</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
        <tr>
          <td style="padding-right:18px;font-size:13px;color:#6b7280;">[BEDS] bed</td>
          <td style="padding-right:18px;font-size:13px;color:#6b7280;">[BATHS] bath</td>
          <td style="font-size:13px;color:#6b7280;">[SQFT] sqft</td>
        </tr>
      </table>
      <a href="[LISTING_URL]" style="display:inline-block;padding:10px 22px;background:#1A56DB;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;">View Listing →</a>
    </td>
  </tr>
</table>

<p>We offer same-day showings and have your application processed within 24–48 hours. No hidden fees, no surprises.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#0B1F3A;border-radius:6px;padding:12px 28px;">
      <a href="[CTA_URL]" style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">Schedule a Showing →</a>
    </td>
  </tr>
</table>

<p>Browse all available homes at <a href="https://haskerrealtygroup.com/properties">haskerrealtygroup.com/properties</a>.</p>

<p style="margin-top:24px;">Warm regards,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },

  {
    id: "price-drop",
    name: "Price Drop Alert",
    category: "listing",
    icon: "📉",
    description: "Notify leads of a price reduction on a property they may have passed on.",
    subjectLines: [
      "Price reduced: [City] listing now at $[Price]/mo",
      "{{name}}, that home you might have missed is now more affordable",
      "We dropped the price — don't miss this one",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<p>Good news — a property you may have had your eye on just got a price reduction. Now's the right time to take a second look.</p>

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
      <p style="font-size:13px;color:#374151;margin:0 0 14px 0;">[ADDRESS] &nbsp;·&nbsp; [CITY], [STATE]</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
        <tr>
          <td style="padding-right:18px;font-size:13px;color:#6b7280;">[BEDS] bed</td>
          <td style="padding-right:18px;font-size:13px;color:#6b7280;">[BATHS] bath</td>
          <td style="font-size:13px;color:#6b7280;">[SQFT] sqft</td>
        </tr>
      </table>
      <a href="[LISTING_URL]" style="display:inline-block;padding:10px 22px;background:#1A56DB;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;">View Updated Listing →</a>
    </td>
  </tr>
</table>

<p>Prices like this move fast. Same-day showings are available — just reply to this email and we'll get you scheduled.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#0B1F3A;border-radius:6px;padding:12px 28px;">
      <a href="[CTA_URL]" style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">Book a Showing Today →</a>
    </td>
  </tr>
</table>

<p style="margin-top:24px;">Best,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },

  {
    id: "city-spotlight",
    name: "City Spotlight",
    category: "listing",
    icon: "🏙️",
    description: "Showcase multiple available listings in a single city to targeted prospects.",
    subjectLines: [
      "Top homes available in [City] right now",
      "{{name}}, here's what's available in [City] this week",
      "Fresh listings in [City] — well-maintained, move-in ready",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<p>We know you're looking in <strong>[CITY]</strong> — so we've pulled together our best available homes there right now. Well-maintained, honestly priced, and move-in ready.</p>

<!-- Listing 1 -->
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:20px 0;">
  <tr>
    <td style="padding:20px;">
      <p style="font-size:18px;font-weight:700;color:#0B1F3A;margin:0 0 4px 0;">$[PRICE_1]/mo</p>
      <p style="font-size:13px;color:#374151;margin:0 0 10px 0;">[ADDRESS_1] &nbsp;·&nbsp; [CITY], [STATE]</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td style="padding-right:16px;font-size:12px;color:#6b7280;">[BEDS_1] bed</td>
          <td style="padding-right:16px;font-size:12px;color:#6b7280;">[BATHS_1] bath</td>
          <td style="font-size:12px;color:#6b7280;">[SQFT_1] sqft</td>
        </tr>
      </table>
      <a href="[URL_1]" style="font-size:13px;color:#1A56DB;text-decoration:none;font-weight:600;">View Listing →</a>
    </td>
  </tr>
</table>

<!-- Listing 2 -->
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 20px 0;">
  <tr>
    <td style="padding:20px;">
      <p style="font-size:18px;font-weight:700;color:#0B1F3A;margin:0 0 4px 0;">$[PRICE_2]/mo</p>
      <p style="font-size:13px;color:#374151;margin:0 0 10px 0;">[ADDRESS_2] &nbsp;·&nbsp; [CITY], [STATE]</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td style="padding-right:16px;font-size:12px;color:#6b7280;">[BEDS_2] bed</td>
          <td style="padding-right:16px;font-size:12px;color:#6b7280;">[BATHS_2] bath</td>
          <td style="font-size:12px;color:#6b7280;">[SQFT_2] sqft</td>
        </tr>
      </table>
      <a href="[URL_2]" style="font-size:13px;color:#1A56DB;text-decoration:none;font-weight:600;">View Listing →</a>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#0B1F3A;border-radius:6px;padding:12px 28px;">
      <a href="https://haskerrealtygroup.com/properties" style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">See All [City] Homes →</a>
    </td>
  </tr>
</table>

<p>We house 2,000+ families across 12+ cities. Kids, pets, extended family — we work with you.</p>

<p style="margin-top:24px;">Warm regards,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },

  {
    id: "apply-reminder",
    name: "Application Reminder",
    category: "followup",
    icon: "📋",
    description: "Nudge warm leads who showed interest but haven't submitted an application.",
    subjectLines: [
      "{{name}}, you're one step away from your new home",
      "Don't lose your spot — complete your application today",
      "Your dream home won't wait — apply in minutes",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<p>You showed interest in one of our homes recently — and we wanted to make sure you didn't miss your chance. Good homes go fast, and we'd hate for you to lose out.</p>

<p>Here's a reminder of what's waiting for you:</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-left:3px solid #1A56DB;background:#f8faff;margin:20px 0;padding:0;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="font-size:15px;font-weight:700;color:#0B1F3A;margin:0 0 4px 0;">[ADDRESS]</p>
      <p style="font-size:13px;color:#374151;margin:0 0 6px 0;">[CITY], [STATE] &nbsp;·&nbsp; $[PRICE]/mo</p>
      <p style="font-size:12px;color:#6b7280;margin:0;">[BEDS] bed &nbsp;·&nbsp; [BATHS] bath &nbsp;·&nbsp; [SQFT] sqft</p>
    </td>
  </tr>
</table>

<p>Our application process is fast and straightforward:</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:6px 0;font-size:13px;color:#374151;">✅ &nbsp;Apply online in minutes</td>
  </tr>
  <tr>
    <td style="padding:6px 0;font-size:13px;color:#374151;">✅ &nbsp;Decision within 24–48 hours</td>
  </tr>
  <tr>
    <td style="padding:6px 0;font-size:13px;color:#374151;">✅ &nbsp;Digital lease signing — no trips required</td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="background:#1A56DB;border-radius:6px;padding:13px 30px;">
      <a href="[APPLY_URL]" style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">Complete My Application →</a>
    </td>
  </tr>
</table>

<p>Questions? Simply reply to this email or call us — we'll help you every step of the way.</p>

<p style="margin-top:24px;">Rooting for you,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },

  {
    id: "move-in-special",
    name: "Move-In Special",
    category: "promo",
    icon: "🎁",
    description: "Promote a limited-time offer like a deposit waiver or first month free.",
    subjectLines: [
      "{{name}}, move-in special ending soon — don't miss it",
      "First month free + no deposit on select [City] homes",
      "Exclusive offer: move in this month and save $[SAVINGS]",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<p>For a limited time, we're offering an exclusive move-in special on select homes — and you're one of the first to hear about it.</p>

<!-- Promo banner -->
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#0B1F3A;border-radius:10px;margin:24px 0;">
  <tr>
    <td align="center" style="padding:28px 32px;">
      <p style="font-size:11px;color:#93c5fd;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px 0;">Limited Time Offer</p>
      <p style="font-size:26px;font-weight:800;color:#ffffff;margin:0 0 6px 0;">[OFFER_HEADLINE]</p>
      <p style="font-size:13px;color:#93c5fd;margin:0;">e.g. First month free &nbsp;·&nbsp; No security deposit &nbsp;·&nbsp; Waived application fee</p>
    </td>
  </tr>
</table>

<p>This offer applies to select move-in ready homes in <strong>[CITY]</strong> for anyone who signs a lease by <strong>[DEADLINE]</strong>.</p>

<p style="font-size:13px;color:#6b7280;font-style:italic;">Terms: [TERMS_DETAILS]. Offer subject to availability. Contact us for qualifying homes.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="background:#1A56DB;border-radius:6px;padding:12px 28px;">
      <a href="https://haskerrealtygroup.com/properties" style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">Browse Qualifying Homes →</a>
    </td>
  </tr>
</table>

<p>Same-day showings available. We'll get you in, answer every question, and make this as easy as possible.</p>

<p style="margin-top:24px;">Best,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },

  {
    id: "re-engagement",
    name: "Re-Engagement",
    category: "retention",
    icon: "💬",
    description: "Win back leads who went cold — new inventory, prices, and a personal touch.",
    subjectLines: [
      "Still looking, {{name}}? We have new options for you",
      "A lot has changed — new homes, better prices in [City]",
      "We miss you, {{name}} — here's what's new at Hasker & Co.",
    ],
    bodyHtml: `<p>Hi <strong>{{name}}</strong>,</p>

<p>It's been a while — and we wanted to reach out personally to let you know that a lot has changed since we last connected.</p>

<p>We've added new homes across <strong>[CITY]</strong> and other cities, with prices to fit nearly every budget — from under $800 to $3,500+/month. And we're still doing what we've always done:</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr><td style="padding:5px 0;font-size:13px;color:#374151;">🏠 &nbsp;Well-maintained homes, move-in ready</td></tr>
  <tr><td style="padding:5px 0;font-size:13px;color:#374151;">⚡ &nbsp;Same-day showings, 24–48hr decisions</td></tr>
  <tr><td style="padding:5px 0;font-size:13px;color:#374151;">🐾 &nbsp;Kids, pets, extended family — we work with you</td></tr>
  <tr><td style="padding:5px 0;font-size:13px;color:#374151;">💰 &nbsp;Honest prices, no hidden fees</td></tr>
</table>

<p>Whether you're still searching or your situation has changed, we'd love to help you find something that works. We have [LISTING_COUNT]+ available homes right now.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="background:#0B1F3A;border-radius:6px;padding:12px 28px;">
      <a href="https://haskerrealtygroup.com/properties" style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">See What's Available →</a>
    </td>
  </tr>
</table>

<p>If now's not the right time, no worries at all — just reply and let us know. We're here whenever you're ready.</p>

<p style="margin-top:24px;">Take care,<br><strong>The Hasker &amp; Co. Team</strong><br><span style="font-size:12px;color:#9ca3af;">info@haskerrealtygroup.com</span></p>`,
  },
];
