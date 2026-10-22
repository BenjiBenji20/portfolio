# EmailJS Dispatcher & Contact Form Handling

> **Overview:** Procedural instructions for the Agentic Dev to configure and handle contact form submissions via EmailJS, enforce input sanitization, integrate bot validation, and provide immediate visual feedback.  
> **When to Use:** Consult when authoring contact form components, configuring EmailJS credentials, connecting submit actions to serverless dispatchers, or handling user response states.

---

## 1. Credential Security & Environment Configuration
- **Variable Separation:**
  - `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`: Safe for client-side bundle exposure during SDK initialization.
  - `EMAILJS_SERVICE_ID` and `EMAILJS_TEMPLATE_ID`: Configure via environment variables. If dispatching directly from client forms, use `NEXT_PUBLIC_` prefixes; if routing through the unified serverless gateway, keep them server-side.
  - `EMAILJS_PRIVATE_KEY` (if using Serverless REST API): Treat as a strict server-only secret. Never expose in client code.
- **Strict Environment Checks:**
  - Verify all required configuration keys are present at runtime before triggering a dispatch call, returning a graceful fallback error if credentials are unconfigured.

---

## 2. Input Sanitization & Pre-Dispatch Validation
- **Client & Server Schema Validation:**
  - Enforce a strict Zod schema on form inputs prior to dispatch:
    - `name`: String, non-empty, trimmed, maximum 100 characters.
    - `email`: Validated email address format, lowercase, trimmed.
    - `message`: String, minimum 10 characters, maximum 2000 characters to prevent payload bloating.
- **Bot Defense Verification:**
  - Form submission must require an active Google reCAPTCHA v3 token.
  - Execute token generation just-in-time on submit with action name `contact_submit`. Verify the token against the risk threshold before sending through EmailJS.
- **HTML & String Sanitization:**
  - Strip or escape executable tags (`<script>`, `<iframe>`, inline event handlers) to prevent stored XSS inside the target email client.

---

## 3. Dispatch Strategy: Client SDK vs. Serverless Gateway
- **Preferred Architecture (Unified Gateway):**
  - Route submissions to the consolidated Next.js API handler (`/api/gateway` with `action: "contact"`).
  - Perform reCAPTCHA verification and rate limiting server-side, then invoke the EmailJS REST API (`https://api.emailjs.com/api/v1.0/email/send`) using Node/Fetch.
  - Protects service IDs, template IDs, and private tokens from network-tab snooping.
- **Client-Side Direct Dispatch Fallback:**
  - If direct browser dispatch is used via `@emailjs/browser`, initialize via `emailjs.init({ publicKey })`.
  - Pass structured template parameters matching your configured email template variables: `user_name`, `user_email`, `message`, `timestamp`.

---

## 4. Interaction States & Visual Feedback
- **Submission Lifecycle:**
  - **Idle:** Form fields enabled, submit button interactive with clear visual affordance.
  - **Submitting (Pending):** Disable inputs and button immediately to prevent double submissions. Display a subtle loading indicator or replace button label with "Sending...".
  - **Success:** Reset form fields, render an inline success message with a checkmark, and notify the user their message has been sent.
  - **Error:** Retain field inputs so the user does not lose their typed message. Display an inline alert with a descriptive error message and provide a retry trigger.