# CMS Data Contracts & Integration Specification

> **Overview:** Specifies client configuration, mutation patterns, transaction boundaries, and querying rules for Sanity integration, instructing Agentic Dev how to persist and read data dynamically without enforcing specific schema fields.  
> **When to Use:** Reference when building `/sanity/lib/`, writing database mutation helpers, configuring the Sanity client, or executing GROQ projections.

---

## 1. Client Configuration & Runtime Boundaries
- **Client Instances:** Maintain separate client configurations for read-only public queries and privileged server-side writes (`sanity/lib/client.ts`).
- **Token Security:** Ensure mutations strictly utilize `SANITY_API_WRITE_TOKEN` in serverless route handlers; never expose write tokens to the browser.
- **API Versioning:** Pin Sanity API versions (e.g., `2024-01-01`) across all clients to guarantee consistent GROQ response structures and avoid breaking changes.

## 2. Dynamic Mutation & Idempotency Rules
- **Schema-Agnostic Payloads:** Build mutation helpers that accept generic document definitions rather than hardcoding static field keys.
- **Idempotent Inserts:** Prevent duplicate content from multiple webhook deliveries by deriving deterministic document IDs:
  ```typescript
  const documentId = `agent-${sourceNamespace}-${commitSha.slice(0, 7)}`;

```

```

* **Safe Persistence Pattern:** Prefer `client.createIfNotExists()` or atomic patches (`client.patch(id).set(...)`) over destructive overwrites (`createOrReplace`) to avoid overwriting user edits.

## 3. Media & Asset Pipeline Handlers

* **Buffer Ingestion:** Provide utility functions to upload binary streams or remote media buffers via `client.assets.upload('image' | 'file', stream)`.
* **Reference Binding:** Construct valid Sanity asset references dynamically from upload responses (`{ _type: 'image', asset: { _type: 'reference', _ref: assetId } }`).

## 4. Query & Projection Best Practices

* **Parameterized GROQ:** Never concatenate raw user or repo variables directly into GROQ queries; always pass query parameters separately.
* **Projection Minimization:** Request only fields explicitly needed by the consuming component or chat agent to minimize payload transfer and memory overhead.
* **Graceful Nullability:** Assume any non-system field in Sanity documents may be optional or null; implement defensive parsing on query results.

```
