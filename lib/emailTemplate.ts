function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function wrapWithBrandTemplate(bodyHtml: string, subject: string): string {
  const safeSubject = escapeHtml(subject || "Hasker & Co. Realty Group");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>${safeSubject}</title>
  <!--[if mso]><xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml><![endif]-->
  <style>
    body, table, td, p, a, h1, h2, h3 { margin: 0; padding: 0; border: 0; }
    body {
      background-color: #f5f5f5;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      font-family: 'DM Sans', Arial, Helvetica, sans-serif;
    }
    img { border: 0; display: block; max-width: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    a { color: #1A56DB; text-decoration: none; }
    a:hover { text-decoration: underline; }

    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-pad { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
  <tr>
    <td align="center" style="padding: 0;">

      <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0"
        style="max-width: 600px; width: 100%; background-color: #ffffff;">

        <!-- ── HEADER: logo + tagline only ── -->
        <tr>
          <td class="email-pad" align="center"
            style="padding: 36px 40px 28px; border-bottom: 1px solid #e5e7eb;">

            <!-- Logo -->
            <!--[if !mso]><!-->
            <img src="https://haskerrealtygroup.com/logo.svg"
                 alt="Hasker &amp; Co. Realty Group"
                 width="180" height="32"
                 style="display: block; margin: 0 auto 12px auto; border: 0;" />
            <!--<![endif]-->
            <!--[if mso]>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 12px auto;">
              <tr>
                <td style="font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; color: #0B1F3A; letter-spacing: 1px;">
                  HASKER &amp; CO. <span style="color: #1A56DB;">REALTY GROUP</span>
                </td>
              </tr>
            </table>
            <![endif]-->

            <!-- Tagline -->
            <p style="font-family: 'DM Sans', Arial, Helvetica, sans-serif;
                      font-size: 11px;
                      color: #9ca3af;
                      letter-spacing: 1.5px;
                      text-transform: uppercase;
                      margin: 0;">
              Comfortable Living, Within Your Budget.
            </p>

          </td>
        </tr>

        <!-- ── BODY: no card, just padding ── -->
        <tr>
          <td class="email-pad"
            style="padding: 36px 40px;
                   font-family: 'DM Sans', Arial, Helvetica, sans-serif;
                   font-size: 15px;
                   line-height: 1.75;
                   color: #111827;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- ── FOOTER: plain, minimal ── -->
        <tr>
          <td class="email-pad" align="center"
            style="padding: 24px 40px 32px; border-top: 1px solid #e5e7eb;">

            <p style="font-family: 'DM Sans', Arial, Helvetica, sans-serif;
                      font-size: 12px;
                      color: #6b7280;
                      margin: 0 0 6px 0;">
              Hasker &amp; Co. Realty Group &nbsp;&middot;&nbsp; 213 Bob Ln, Virginia Beach, VA 23454
            </p>

            <p style="font-family: 'DM Sans', Arial, Helvetica, sans-serif;
                      font-size: 12px;
                      color: #6b7280;
                      margin: 0 0 12px 0;">
              <a href="mailto:info@haskerrealtygroup.com"
                 style="color: #6b7280; text-decoration: none;">info@haskerrealtygroup.com</a>
              &nbsp;&middot;&nbsp;
              <a href="https://haskerrealtygroup.com"
                 style="color: #6b7280; text-decoration: none;">haskerrealtygroup.com</a>
            </p>

            <p style="font-family: 'DM Sans', Arial, Helvetica, sans-serif;
                      font-size: 11px;
                      color: #9ca3af;
                      margin: 0;">
              &copy; 2025 Hasker &amp; Co. Realty Group. &nbsp;
              <a href="https://haskerrealtygroup.com/unsubscribe"
                 style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
            </p>

          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}
