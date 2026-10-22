# GitHub Webhook Intake & HMAC Security

> **Overview:** Procedural instructions for the Agentic Dev to build a secure Next.js Route Handler that verifies incoming GitHub payloads, extracts event metadata, and manages fast response timeouts.  
> **When to Use:** Consult when implementing or updating `/app/api/webhooks/github/route.ts`, configuring webhook secrets, or structuring payload extraction pipelines.

---

## 1. Web Crypto HMAC Verification Directives
- **Raw Body Handling:** Always capture the incoming request body as raw text before performing any JSON parsing. Never reconstruct or re-stringify JSON objects for verification, as character whitespace alterations will break signature matches.
- **Header Extraction:** Retrieve the `x-hub-signature-256` header directly from the request. If the header is missing, malformed, or does not begin with the `sha256=` prefix, reject the request immediately with an HTTP 401 status.
- **Signature Computation:**
  - Convert the shared secret and raw text payload into byte buffers using standard text encoding.
  - Compute an HMAC digest using the SHA-256 algorithm via the runtime's native Web Crypto API (`crypto.subtle`).
  - Format the resulting digest as a lowercase hexadecimal string prefixed with `sha256=`.
- **Timing-Safe Comparison:** Compare the computed signature against the incoming header using a constant-time comparison algorithm to prevent side-channel timing attacks. Avoid standard string equality operators (`===`).

---

## 2. Event Filtering & Payload Extraction Directives
- **Event Header Inspection:** Read the `x-github-event` header. Explicitly handle only `push` and `release` events. For all other event types (e.g., `ping`, `issues`, `star`), acknowledge receipt immediately with an HTTP 200 status and exit early.
- **Payload Normalization:** Do not forward the raw, heavy GitHub payload downstream. Parse and extract only the essential operational fields:
  - Repository identifiers: name, full name, and repository URL.
  - Branch reference: verify if the target branch matches the repository's default branch.
  - Commit context: head commit ID, commit message, timestamp, author name/username, and lists of added, modified, and removed file paths.
- **Branch Guardrail:** Ignore pushes to non-production/feature branches unless explicitly configured. Acknowledge these requests with an HTTP 200 status and a descriptive skip message to prevent GitHub from flagging failed webhook deliveries.

---

## 3. Response Execution & Timeout Discipline
- **Fast-Acknowledgment Rule:** Process header verification, event routing, and basic schema checks within a 3-second window. Acknowledge with an HTTP 202 Accepted or HTTP 200 OK before initiating long-running downstream tasks.
- **Downstream Decoupling:** Hand off heavy operations—such as remote git diff downloads, AI synthesis, and Sanity content lake mutations—to an asynchronous task queue or an execution handler so the webhook delivery connection never times out.
- **Security Isolation:** Keep the webhook secret strictly server-side. Never expose the secret to client bundles, log outputs, or error payloads returned to the client.