# Real-Time Conversational Grounding & Streaming Chat (RAG)

> **Overview:** Procedural instructions for the Agentic Dev to implement the portfolio's RAG-backed interactive chat assistant using Gemini 3.5-Flash, dynamic GROQ projections from Sanity, and low-latency token streaming.  
> **When to Use:** Consult when building `/app/api/chat/route.ts`, structuring real-time conversational retrieval pipelines, managing token-efficient system prompts, or wiring the client-side streaming UI.

---

## 1. Context Retrieval & GROQ Projection Directives
- **Zero Heavy Vector DBs:** Ground responses dynamically using targeted GROQ queries against Sanity instead of maintaining persistent, paid vector databases.
- **Intent Extraction & Filtered Retrieval:**
  - Analyze the incoming user query to identify mentioned projects, technologies, or general timeline queries.
  - Execute a compact, projection-optimized GROQ query retrieving only the necessary fields: project title, overview, tech stack array, key architectural decisions, and recent devlog titles/summaries.
  - Strip full-text markdown bodies, image arrays, and internal CMS metadata before passing retrieved documents into the context window to preserve token budgets.

---

## 2. System Prompt Architecture & Grounding Rules
- **Identity & Boundary Enforcement:**
  - Define the assistant's persona strictly as a knowledgeable technical guide representing the developer's portfolio and architecture.
  - Mandate strict grounding: the model must answer solely based on the injected Sanity project context and developer profile data.
  - When asked about unreferenced tools, projects, or personal topics outside the provided context, the model must concisely decline rather than speculate or hallucinate.
- **Attribution & Deep-Linking Requirement:**
  - Instruct the model to cite specific projects and devlogs by outputting structured inline markdown links using canonical route patterns (e.g., `[Project Name](/projects/slug)` or `[DevLog Title](/projects/slug/logs/log-slug)`).

---

## 3. Streaming Engine & Route Handler Pattern
- **Streaming Execution:**
  - Initialize the Google Gen AI SDK stream with `gemini-3.5-flash` passing the conversation history, the freshly retrieved context block, and the latest user turn.
  - Return a standards-compliant streaming response (e.g., using Web Streams API `ReadableStream` or the Vercel AI SDK protocol) to achieve instant time-to-first-token (< 500ms).
- **Session & History Windowing:**
  - Limit multi-turn conversation memory passed in the payload to the last 6–8 messages to prevent context bloat and control latency.
  - Summarize or drop older conversational turns when approaching token thresholds.

---

## 4. UI Stream Handling & Interaction Directives
- **Client Reader Implementation:**
  - Consume incoming text chunks via a streaming hook, updating the message bubble reactively with smooth text appearance.
  - Autoscroll the chat drawer to the bottom as tokens stream in, but immediately disengage autoscroll if the user manually scrolls up to inspect previous turns.
- **Render Safety & Link Formatting:**
  - Ensure markdown renderers safely sanitize and parse incoming streamed tokens on the fly, rendering internal links as functional client navigation elements without full-page reloads.