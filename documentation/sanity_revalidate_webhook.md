# Sanity On-Demand Revalidation Webhook Architecture

**Date Started:** 2026-10-23  
**Status:** Implemented  

## 1. Overview
Provides instantaneous on-demand cache revalidation across Next.js ISR and `'use cache'` functions whenever content is published, updated, or deleted in the Sanity Content Lake.

## 2. Invalidation Flow Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant Sanity as Sanity Studio / Content Lake
    participant Webhook as /api/revalidate (Next.js)
    participant Cache as Next.js Cache (Tags & Routes)
    participant Client as Web Visitor

    Sanity->>Webhook: POST /api/revalidate + HMAC Header
    Note over Webhook: Validate secret via parseBody()
    alt Invalid Signature
        Webhook-->>Sanity: 401 Unauthorized
    else Valid Signature
        Webhook->>Cache: revalidateTag(`sanity:${_type}`)
        Webhook->>Cache: revalidatePath('/', 'layout')
        Webhook->>Cache: revalidatePath('/projects', 'page') (if project)
        Webhook-->>Sanity: 200 OK { revalidated: true, type }
        Client->>Webhook: Navigates to Portfolio Site
        Cache-->>Client: Serves Fresh Content Instantly
    end
```

## 3. Webhook Registration Details
- **Target URL Endpoint:** `https://<DOMAIN>/api/revalidate` (or tunnel for local dev)
- **HTTP Method:** `POST`
- **Secret:** Value of `SANITY_REVALIDATE_SECRET` environment variable
- **Trigger on:** Create, Update, Delete
- **Filter (GROQ):**
  ```groq
  _type in [
    "profile",
    "summaryOverview",
    "focusPillar",
    "experience",
    "project",
    "contact",
    "emailContactInquiryTemplate"
  ]
  ```

## 4. Key Invariants & Security
- **HMAC Verification:** Uses `@sanity/webhook` via `next-sanity/webhook`'s `parseBody()` to authenticate callers.
- **Hierarchical Revalidation:** Invokes `revalidateTag` for scoped tag caches (`sanity:${_type}`) and `revalidatePath('/', 'layout')` to purge cached layout trees, navigation headers, and pages simultaneously.
