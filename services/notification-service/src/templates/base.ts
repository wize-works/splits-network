/**
 * Base HTML Email Template for Splits Network
 * Matches brand styling from the portal: #233876 primary, #0f9d8a secondary
 */

export type EmailSource = 'portal' | 'candidate' | 'corporate';

export interface BaseEmailProps {
    preheader?: string;
    content: string;
    source?: EmailSource;
}

/**
 * Get the logo URL based on source
 * Defaults to portal if not specified
 */
function getLogoUrl(source?: EmailSource): string {
    switch (source) {
        case 'candidate':
            return 'https://applicant.network/logo.svg';
        case 'corporate':
            return 'https://employment-networks.com/logo.svg';
        case 'portal':
        default:
            return 'https://splits.network/logo.svg';
    }
}

/**
 * Get the tagline based on source
 */
function getTagline(source?: EmailSource): string {
    switch (source) {
        case 'candidate':
            return 'Your Career Journey';
        case 'corporate':
            return 'Split-Fee Recruiting Platform';
        case 'portal':
        default:
            return 'Split-Fee Recruiting Marketplace';
    }
}

/**
 * Base email template with header, footer, and brand styling
 * Optimized for email clients with inline styles
 */
export function baseEmailTemplate({ preheader, content, source }: BaseEmailProps): string {
    const logoUrl = getLogoUrl(source);
    const tagline = getTagline(source);
    return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office">
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: "Segoe UI", sans-serif; mso-line-height-rule: exactly;}
  </style>
  <![endif]-->
  <title>Splits Network</title>
  <style>
    @media (max-width: 600px) {
      .sm-w-full {
        width: 100% !important;
      }
      .sm-px-24 {
        padding-left: 24px !important;
        padding-right: 24px !important;
      }
      .sm-py-32 {
        padding-top: 32px !important;
        padding-bottom: 32px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; width: 100%; padding: 0; word-break: break-word; -webkit-font-smoothing: antialiased; background-color: #f3f4f6;">
  ${preheader ? `<div style="display: none;">${preheader}</div>` : ''}
  
  <div role="article" aria-roledescription="email" aria-label="Splits Network" lang="en">
    <!-- Email Container -->
    <table style="width: 100%; font-family: -apple-system, 'Segoe UI', sans-serif;" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="background-color: #f3f4f6; padding: 24px 0;">
          
          <!-- Main Email Card -->
          <table style="width: 100%; max-width: 600px;" cellpadding="0" cellspacing="0" role="presentation">
            
            <!-- Header -->
            <tr>
              <td style="background-color: #233876; padding: 32px 24px; text-align: center;">
                <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                  <tr>
                    <td style="text-align: center;">
                      <img src="${logoUrl}" alt="Splits Network" style="height: 48px; width: auto; margin: 0 auto 16px; display: block;" />
                      <p style="margin: 8px 0 0; font-size: 14px; color: #e5e7eb;">
                        ${tagline}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="background-color: #ffffff; padding: 40px 32px;">
                ${content}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #111827; padding: 32px 24px; text-align: center;">
                <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                  <tr>
                    <td style="text-align: center; padding-bottom: 16px;">
                      <a href="https://splits.network" style="color: #60a5fa; text-decoration: none; font-size: 14px; font-weight: 600;">
                        Visit Splits Network
                      </a>
                      <span style="color: #9ca3af; margin: 0 12px;">•</span>
                      <a href="https://splits.network/help" style="color: #60a5fa; text-decoration: none; font-size: 14px; font-weight: 600;">
                        Help Center
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="text-align: center; color: #9ca3af; font-size: 13px; line-height: 20px;">
                      © ${new Date().getFullYear()} Splits Network. All rights reserved.
                      <br>
                      <a href="https://splits.network/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy Policy</a>
                      <span style="margin: 0 8px;">•</span>
                      <a href="https://splits.network/terms" style="color: #9ca3af; text-decoration: underline;">Terms of Service</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
          
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
    `.trim();
}
