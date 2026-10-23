import type { EmailContactInquiryTemplateData } from '@/types/sanity';
import type { Attachment } from 'resend';
import { resolveEmailIcon } from './emailAssets';

export interface ContactEmailPayload {
  name?: string;
  email: string;
  phone?: string;
  subject: string;
  content: string;
}

/**
 * Escapes unsafe HTML characters to prevent XSS within email clients.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates both an HTML email body and a plain-text fallback
 * using dynamic template configuration from the Email Contact Inquiry Template schema.
 */
export function generateContactEmailContent(
  payload: ContactEmailPayload,
  templateConfig?: EmailContactInquiryTemplateData
): {
  subject: string;
  html: string;
  text: string;
  attachments?: Attachment[];
} {
  const dispatchType = templateConfig?.dispatchType?.trim() || 'Visitor Contact Email';
  const prefix = templateConfig?.subjectPrefix?.trim() || '[Portfolio Contact]';
  const headline =
    templateConfig?.headline?.trim() || 'New Inquiry from Portfolio Contact Form';
  const footerNote =
    templateConfig?.footerNote?.trim() ||
    'Dispatched securely via Benjineer Portfolio. Reply directly to this email to respond.';

  const fullSubject = `${prefix} ${payload.subject}`;

  // Resolve icon using the modular email asset utility (handles Sanity CDN vs inline CID attachment)
  const { src: iconSrc, attachment } = resolveEmailIcon(templateConfig?.icon);

  const safeDispatchType = escapeHtml(dispatchType);
  const safeName = escapeHtml(payload.name?.trim() || 'Anonymous Visitor');
  const safeEmail = escapeHtml(payload.email.trim());
  const safePhone = payload.phone?.trim() ? escapeHtml(payload.phone.trim()) : 'Not provided';
  const safeSubject = escapeHtml(payload.subject.trim());
  const safeContent = escapeHtml(payload.content.trim());

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fullSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #18181b 0%, #09090b 100%); border-bottom: 1px solid #27272a;">
              <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #38bdf8; background-color: transparent; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(56, 189, 248, 0.3); margin-bottom: 12px;">
                <img src="${escapeHtml(iconSrc)}" alt="Logo" width="14" height="14" style="display: inline-block; vertical-align: middle; margin-right: 6px; border-radius: 9999px;" />
                <span style="vertical-align: middle;">${safeDispatchType}</span>
              </span>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #fafafa; line-height: 1.3;">
                ${escapeHtml(headline)}
              </h1>
            </td>
          </tr>

          <!-- Metadata Fields -->
          <tr>
            <td style="padding: 24px 32px 12px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #a1a1aa; width: 110px; font-weight: 600;">
                    Sender Name:
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: #f4f4f5; font-weight: 500;">
                    ${safeName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #a1a1aa; font-weight: 600;">
                    Email:
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: #38bdf8;">
                    <a href="mailto:${safeEmail}" style="color: #38bdf8; text-decoration: none;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #a1a1aa; font-weight: 600;">
                    Phone / Viber:
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: #d4d4d8;">
                    ${safePhone}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #a1a1aa; font-weight: 600;">
                    Subject:
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: #f4f4f5; font-weight: 600;">
                    ${safeSubject}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #27272a; width: 100%;"></div>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 20px 32px 28px 32px;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #a1a1aa; margin-bottom: 12px;">
                Message Content:
              </div>
              <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 18px; font-size: 14px; line-height: 1.6; color: #e4e4e7; white-space: pre-wrap; word-break: break-word;">
${safeContent}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #121215; border-top: 1px solid #27272a; font-size: 12px; color: #71717a; line-height: 1.5; text-align: center;">
              ${escapeHtml(footerNote)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
[${dispatchType}] ${headline}
----------------------------------------
Sender Name:    ${payload.name?.trim() || 'Anonymous'}
Sender Email:   ${payload.email.trim()}
Phone / Viber:  ${payload.phone?.trim() || 'Not provided'}
Subject:        ${payload.subject.trim()}

Message:
${payload.content.trim()}

----------------------------------------
${footerNote}
  `.trim();

  return {
    subject: fullSubject,
    html,
    text,
    attachments: attachment ? [attachment] : undefined,
  };
}
