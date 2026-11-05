# Context Retrieval & Portfolio Chat Specification

> **Overview:** Specifies the architectural rules for the visitor chat feature, instructing the Agentic Dev on how to implement low-latency grounding, streaming responses, and GROQ-based context injection without relying on external vector databases.  
> **When to Use:** Reference when building or refactoring `/app/api/chat/route.ts`, context assembly utilities, streaming response handlers, or grounding system prompts.

---

## 1. Architectural Guardrails for the Agentic Dev
- **No Vector DBs:** Do not install, import, or configure external vector stores (e.g., Qdrant, Pinecone). Context retrieval must rely solely on structured GROQ queries.
- **Context Injection Boundary:** Grounding context must be fetched dynamically at request time from Sanity and injected into the Gemini context window alongside visitor queries.
- **Latency Budget:** Keep end-to-end time to first token under 1.5 seconds. Route handlers must stream chunks directly to the client.

## 2. Dynamic Context Assembly & GROQ Retrieval
- **Coarse Context Pass:** Query a lightweight index of all published projects (title, tech stack, live URLs, repository links, high-level summaries) using a fast GROQ projection.
- **Targeted DevLog Pass:** If the visitor's query specifies a particular project or recent activity, execute a parameterized query for the latest devlog excerpts belonging to that project.
- **Payload Truncation:** Sanitize and compress retrieved Sanity documents to plaintext or minified JSON before feeding into the prompt to conserve context tokens.

## 3. Gemini Runtime & Streaming Contracts
- **Endpoint Pattern:** Implement as a Next.js App Router POST route (`/app/api/chat/route.ts`) returning an AI SDK `DataStreamResponse` or native `ReadableStream`.
- **Model Selection:** Use `gemini-2.5-flash` with low temperature (0.2–0.4) to maintain high factual consistency and prevent hallucinations.
- **Grounding Directives:** Instruct the model via system instructions to answer strictly based on the injected Sanity records. Missing details must be acknowledged directly without inventing tech stacks, dates, or repository features.

## 4. Client State & Session Boundaries
- **Stateless Serverless:** Do not maintain conversational session state on the server. Pass recent conversation history from the client within a bounded sliding window (e.g., last 6 messages).
- **Error Propagation:** If Sanity retrieval fails or times out, degrade gracefully: stream a canned response indicating portfolio records are temporarily unavailable rather than crashing the route.
