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
      background-color: #EBEBEB;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, Arial, Helvetica, sans-serif;
    }
    img { border: 0; display: block; max-width: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    a { color: #0B1F3A; text-decoration: none; }

    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-pad { padding-left: 28px !important; padding-right: 28px !important; }
      .email-body { padding: 32px 28px !important; }
    }
  </style>
</head>
<body>

<!-- Outer background wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EBEBEB; padding: 32px 16px;">
  <tr>
    <td align="center">

      <!-- Email card -->
      <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0"
        style="max-width:600px; width:100%; background-color:#ffffff; border-radius:4px; overflow:hidden; box-shadow:0 2px 24px rgba(0,0,0,0.10);">

        <!-- ── NAVY TOP ACCENT BAR (6px) ── -->
        <tr>
          <td style="background-color:#0B1F3A; height:5px; line-height:5px; font-size:1px;">&nbsp;</td>
        </tr>

        <!-- ── HEADER ── -->
        <tr>
          <td class="email-pad" align="center" style="padding: 44px 48px 36px; background-color:#ffffff;">

            <!--[if !mso]><!-->
            <img src="https://haskerrealtygroup.com/logo.svg"
                 alt="Hasker &amp; Co. Realty Group"
                 width="160" height="auto"
                 style="display:block; margin:0 auto; border:0; max-width:160px;" />
            <!--<![endif]-->

            <!--[if mso]>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 0 auto;">
              <tr>
                <td style="font-family:Georgia,serif; font-size:20px; font-weight:bold; color:#0B1F3A; letter-spacing:2px; text-transform:uppercase;">
                  HASKER &amp; CO.
                </td>
              </tr>
            </table>
            <![endif]-->

            <!-- Tagline -->
            <p style="font-family:'DM Sans',-apple-system,Arial,sans-serif;
                      font-size:10px;
                      color:#9CA3AF;
                      letter-spacing:2.5px;
                      text-transform:uppercase;
                      margin:14px 0 0;
                      line-height:1;">
              Comfortable Living, Within Your Budget
            </p>

          </td>
        </tr>

        <!-- ── GOLD DIVIDER ── -->
        <tr>
          <td style="background-color:#C8A96E; height:2px; line-height:2px; font-size:1px;">&nbsp;</td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td class="email-body" style="padding:44px 48px 40px;
                   font-family:'DM Sans',-apple-system,Arial,Helvetica,sans-serif;
                   font-size:15px;
                   line-height:1.8;
                   color:#1a1a1a;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- ── FOOTER DIVIDER ── -->
        <tr>
          <td style="background-color:#F3F4F6; height:1px; line-height:1px; font-size:1px;">&nbsp;</td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td class="email-pad" align="center" style="padding:32px 48px 36px; background-color:#FAFAFA;">

            <!-- Brand name -->
            <p style="font-family:Georgia,'Times New Roman',serif;
                      font-size:13px;
                      font-weight:700;
                      color:#0B1F3A;
                      letter-spacing:1.5px;
                      text-transform:uppercase;
                      margin:0 0 10px;">
              Hasker &amp; Co. Realty Group
            </p>

            <!-- Address + contact -->
            <p style="font-family:'DM Sans',-apple-system,Arial,sans-serif;
                      font-size:11px;
                      color:#9CA3AF;
                      margin:0 0 4px;
                      line-height:1.6;">
              213 Bob Ln, Virginia Beach, VA 23454
            </p>
            <p style="font-family:'DM Sans',-apple-system,Arial,sans-serif;
                      font-size:11px;
                      color:#9CA3AF;
                      margin:0 0 16px;
                      line-height:1.6;">
              <a href="mailto:info@haskerrealtygroup.com" style="color:#9CA3AF; text-decoration:none;">info@haskerrealtygroup.com</a>
              &nbsp;&middot;&nbsp;
              <a href="https://haskerrealtygroup.com" style="color:#9CA3AF; text-decoration:none;">haskerrealtygroup.com</a>
            </p>

            <!-- Thin gold rule -->
            <table role="presentation" width="48" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
              <tr>
                <td style="background-color:#C8A96E; height:1px; line-height:1px; font-size:1px;">&nbsp;</td>
              </tr>
            </table>

            <!-- Legal + unsubscribe -->
            <p style="font-family:'DM Sans',-apple-system,Arial,sans-serif;
                      font-size:10px;
                      color:#C0C4CB;
                      margin:0;
                      line-height:1.7;">
              &copy; 2025 Hasker &amp; Co. Realty Group. All rights reserved.
              &nbsp;&middot;&nbsp;
              <a href="{{UNSUB_URL}}" style="color:#C0C4CB; text-decoration:underline;">Unsubscribe</a>
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
