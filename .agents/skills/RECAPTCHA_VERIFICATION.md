# Google reCAPTCHA v3 Verification & Bot Defense

> **Overview:** Procedural instructions for the Agentic Dev to implement frictionless bot defense across interactive endpoints (contact form submissions and AI chat interactions) using Google reCAPTCHA v3.  
> **When to Use:** Consult when integrating client-side reCAPTCHA execution hooks, configuring the server-side siteverify verification utility, establishing risk score thresholds, or securing public API handlers against automated abuse.

---

## 1. Client-Side Execution & Token Lifecycle
- **Script Loading & Initialization:**
  - Load the official Google reCAPTCHA v3 script asynchronously using Next.js script optimization utilities, scoped exclusively to pages containing interactive entry points (contact sections and chat widgets).
  - Inject the public site key strictly via client-accessible environment variables. Never bundle or expose the secret key to client-facing assets.
- **Just-In-Time Execution:**
  - Generate reCAPTCHA tokens on demand at the moment of user interaction (e.g., clicking form submit or pressing Enter in the chat drawer). Do not generate tokens on initial page load, as tokens expire after two minutes.
- **Action Scoping:**
  - Pass distinct, semantic action names during token creation (e.g., `contact_submit` for the contact form, `chat_query` for the portfolio assistant) to allow granular risk assessment and traffic segmentation in the Google Admin Console.
- **Graceful Failure & Retries:**
  - If token retrieval fails due to network blockers or client-side privacy extensions, inform the user with a localized, user-friendly error message rather than silently breaking the submission pipeline.

---

## 2. Server-Side Verification Directives
- **Verification Endpoint Contract:**
  - Intercept the client-provided token at the entrance of protected API route handlers (`/api/contact`, `/api/chat`).
  - Make a secure `POST` request to Google’s siteverify endpoint using standard form-urlencoded payload structures containing the secret key, the client token, and optionally the client’s remote IP address.
- **Secure Secret Handling:**
  - Read the private reCAPTCHA secret key strictly from server-side environment variables. Ensure the secret is never committed to version control or included in error traces.
- **Response Validation Checks:**
  - Inspect the verification response object and ensure `success` is strictly true.
  - Validate that the returned `action` string matches the exact expected action name for the requested endpoint, preventing token reuse across different forms.
  - Validate that the timestamp is within an acceptable temporal threshold to prevent replay attacks.

---

## 3. Score Thresholds & Action Policies
- **Score Calibration:**
  - Evaluate the numeric risk score (ranging from 0.0 for automated bots to 1.0 for genuine human interaction).
  - Apply an initial threshold of 0.5 for general interactions. Adjust dynamically based on traffic analysis:
    - High-Value / Expensive Actions (e.g., streaming chat requests to Gemini): Require a score of 0.6 or higher to conserve model quota.
    - Low-Frequency Actions (e.g., sending an email inquiry via Resend): Require a score of 0.5 or higher.
- **Rejection Handling:**
  - Reject requests scoring below the configured threshold with an HTTP 403 Forbidden status and an explicit, sanitized bot-detection error code.
  - Log low-scoring anomalies with associated action names, timestamps, and score metrics for operational auditing without leaking personally identifiable information (PII).
- **Fallback & Rate Limiting Coexistence:**
  - Treat reCAPTCHA v3 as a primary risk filter that operates alongside IP-based rate limiting, ensuring defense-in-depth against distributed abuse.