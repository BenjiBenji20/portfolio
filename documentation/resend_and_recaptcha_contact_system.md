# Contact Dispatcher & reCAPTCHA v3 Architecture

**Date Started:** 2026-10-23  
**Status:** Implemented  

## 1. Overview
Defines the serverless contact dispatching architecture combining Resend outbound email delivery with Google reCAPTCHA v3 bot mitigation and a dedicated Sanity singleton schema (`emailContactInquiryTemplate`).

## 2. Dispatch & Bot Defense Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Visitor
    participant UI as ContactSection
    participant Route as /api/contact
    participant Google as reCAPTCHA API
    participant Sanity as Sanity Client
    participant Resend as Resend API
    actor Dev as Inbox (Benji)

    Visitor->>UI: Submit Contact Form
    UI->>Google: grecaptcha.execute('contact_submit')
    Google-->>UI: reCAPTCHA Token
    UI->>Route: POST { name, email, phone, subject, content, token }
    Route->>Google: siteverify(secret, token)
    Google-->>Route: { success: true, score: 0.9 }
    Route->>Sanity: getEmailContactInquiryTemplate()
    Sanity-->>Route: { dispatchType, icon, subjectPrefix, headline, footerNote }
    Route->>Resend: send({ from: onboarding@resend.dev, to: inbox, replyTo: visitor })
    Resend-->>Dev: Inbound Inquiry Email
    Route-->>UI: { success: true, messageId }
    UI-->>Visitor: Inline Success Banner
```

## 3. Key Invariants & Configurations
- **Sandbox Sender / No Custom Domain:** Dispatches from `onboarding@resend.dev` to personal email (`RESEND_PERSONAL_EMAIL` / `RESEND_TO_EMAIL`) with `replyTo: visitorEmail` to enable direct replies.
- **Bot Defense Threshold:** Calibrated to `score >= 0.5` on action `contact_submit`. Requests scoring below are rejected with `403 Forbidden`.
- **Badge Visibility & TOS Compliance:** Floating `.grecaptcha-badge` is hidden via CSS (`visibility: hidden !important;`), accompanied by explicit Google Terms and Privacy links below the form.
- **Dedicated Template Singleton:** Decoupled into `emailContactInquiryTemplate` document featuring `dispatchType` (fallback: `'Visitor Contact Email'`), optional `icon`, `subjectPrefix`, `headline`, and `footerNote`.
- **State Preservation:** Inputs remain preserved if an error or low confidence score occurs, preventing visitor draft loss.
