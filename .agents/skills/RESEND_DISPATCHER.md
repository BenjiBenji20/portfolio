# Resend Dispatcher & Email Handling

> **Overview:** Procedural instructions for the Agentic Dev to configure and handle outbound email dispatching via Resend backend, enforce input sanitization, integrate bot validation, and provide immediate visual feedback.  
> **When to Use:** Consult when authoring contact form components, configuring Resend credentials, connecting submit actions to serverless dispatchers, building AI alert notifications, or handling user response states.

---

## 1. Domain Architecture & The "No Custom Domain" Tweak

When operating without a custom verified domain on Resend:
- **Sandbox Sender Address:**
  - All outbound emails MUST be dispatched with `from: "onboarding@resend.dev"`.
- **Target Recipient:**
  - Emails MUST be sent directly to the developer's verified personal inbox (`to: process.env.RESEND_PERSONAL_EMAIL`).
- **Visitor Reply-To Header:**
  - Set `reply_to: visitor_email` so that hitting "Reply" in your personal inbox routes responses directly to the visitor who submitted the form.

---

## 2. Primary Email Use Cases

1. **Portfolio Contact Form:**
   - When a visitor completes the contact form, the backend triggers a Resend API call from `onboarding@resend.dev` to your personal email.
   - The visitor's name, email, optional phone/Viber, selected/custom subject, and full message content are formatted cleanly in the email body (HTML + text fallback).
2. **Agentic AI Notifications:**
   - Internal agent workflows and error monitors invoke the exact same Resend dispatcher to send system logs, generation anomalies, or security alerts straight to the developer's inbox.

---

## 3. Credential Security & Environment Configuration

- **Strict Server-Side Isolation:**
  - `RESEND_API_KEY`: Strict server-only secret. NEVER prefix with `NEXT_PUBLIC_` or expose in client bundles.
  - `RESEND_FROM_EMAIL`: Set to `onboarding@resend.dev` (sandbox fallback).
  - `RESEND_PERSONAL_EMAIL`: Developer's destination email address (e.g. `[USER_EMAIL_ADDRESS]`).
- **Runtime Guardrails:**
  - Validate environment variable existence prior to calling the Resend SDK or API endpoint. Fall back gracefully with descriptive server logging if credentials are missing.

---

## 4. Input Sanitization & Pre-Dispatch Validation

- **Client & Server Schema Validation (Zod):**
  - `name`: Optional string, trimmed, maximum 100 characters.
  - `email`: Required valid email address, lowercase, trimmed.
  - `phone`: Optional string, trimmed, maximum 30 characters.
  - `subject`: Required string (from predefined pills or custom user write-in), max 150 characters.
  - `message`: Required string, minimum 10 characters, maximum 3000 characters to prevent payload bloating.
- **Bot Defense Verification:**
  - Contact submissions require an active Google reCAPTCHA v3 token.
  - Execute token generation just-in-time on submit with action name `contact_submit`. Verify the token against the risk threshold (score >= 0.5) server-side before triggering Resend.
- **HTML & String Sanitization:**
  - Strip or escape executable tags (`<script>`, `<iframe>`, inline event handlers) to prevent stored XSS inside the target email client.

---

## 5. Dispatch Implementation Strategy

- **Unified Serverless Route:**
  - Dispatch requests through a serverless route handler (e.g. `/api/contact` or `/api/gateway` with `action: "contact"` or `action: "notify"`).
  - Initialize the Resend client:
    ```typescript
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.RESEND_PERSONAL_EMAIL!,
      reply_to: visitorEmail,
      subject: `[Portfolio Contact] ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name || 'Anonymous'} (${visitorEmail})</p>
        <p><strong>Phone/Viber:</strong> ${phone || 'None provided'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p style="white-space: pre-wrap;">${message}</p>
      `,
    });
    ```

---

## 6. Interaction States & Visual Feedback

- **Idle:** Form fields enabled, submit button interactive with clear visual affordance.
- **Submitting (Pending):** Disable inputs and button immediately to prevent double submissions. Display a loading spinner or label "Sending...".
- **Success:** Reset form fields, render an inline success message with a checkmark, and notify the user their message has been sent.
- **Error:** Retain field inputs so the user does not lose their typed message. Display an inline alert with a descriptive error message and provide a retry trigger.
