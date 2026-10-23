import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { generateContactEmailContent } from '@/lib/email/userContactInquiryTemplate';
import { getEmailContactInquiryTemplate } from '@/sanity/lib/client';

const contactFormSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().min(1, 'Subject is required').max(150),
  content: z.string().trim().min(5, 'Message must be at least 5 characters').max(3000),
  recaptchaToken: z.string().min(1, 'reCAPTCHA verification token is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = contactFormSchema.safeParse(body);

    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => i.message);
      return NextResponse.json(
        { success: false, error: issues.join(', ') },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, content, recaptchaToken } = parseResult.data;

    // 1. Verify Google reCAPTCHA v3 bot defense
    const recaptchaResult = await verifyRecaptchaToken(
      recaptchaToken,
      'contact_submit',
      0.5
    );

    if (!recaptchaResult.success) {
      console.warn('[Contact Route] reCAPTCHA rejected submission:', recaptchaResult.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Security verification failed. Please try again.',
          code: 'BOT_REJECTED',
        },
        { status: 403 }
      );
    }

    // 2. Validate Resend Credentials
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[Contact Route] RESEND_API_KEY environment variable is not defined.');
      return NextResponse.json(
        {
          success: false,
          error: 'Email dispatch service is currently unconfigured.',
        },
        { status: 500 }
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const toEmail =
      process.env.RESEND_PERSONAL_EMAIL ||
      process.env.RESEND_TO_EMAIL ||
      'benjicanones6@gmail.com';

    // 3. Fetch dynamic email template configuration from Sanity
    let emailTemplateConfig;
    try {
      emailTemplateConfig = await getEmailContactInquiryTemplate();
    } catch (err) {
      console.warn('[Contact Route] Could not load Sanity email template config, using defaults:', err);
    }

    // 4. Generate formatted email content
    const emailPayload = {
      name,
      email,
      phone,
      subject,
      content,
    };

    const { subject: fullSubject, html, text, attachments } = generateContactEmailContent(
      emailPayload,
      emailTemplateConfig
    );

    // 5. Dispatch via Resend SDK
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: fullSubject,
      html,
      text,
      attachments,
    });

    if (error) {
      console.error('[Contact Route] Resend dispatch error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send message via email provider.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });
  } catch (error) {
    console.error('[Contact Route] Unhandled exception:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while processing your request.',
      },
      { status: 500 }
    );
  }
}
