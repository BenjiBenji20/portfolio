# Code Quality & Engineering Standards

> **Overview:** Establishes non-negotiable coding conventions, type safety rules, testing mandates, and linting procedures for the Agentic Dev.  
> **When to Use:** Always apply when writing, refactoring, reviewing code, or verifying features across all codebase directories.

---

## 1. Strict Type Safety & Zero `any` Policy
- **Zero `any` Tolerance:** Never use `any` or cast through `as any`. Use strict interfaces, generics, or `unknown` narrowed with explicit type guards.
- **Explicit Return Types:** All exported functions, route handlers, and utility modules must declare explicit return types.
- **Runtime Validation:** Validate external boundaries (GitHub payloads, Sanity responses, Gemini JSON output) using runtime schema validators (e.g., Zod) instead of blind type assertions.
- **No Compiler Bypasses:** Do not commit `@ts-ignore` or `@ts-nocheck`. Use `@ts-expect-error` only with an accompanying inline comment explaining compiler limitations.

## 2. Architecture & File Structure
- **Single Responsibility:** Keep functions decoupled and isolated to a single logical responsibility.
- **Clear Separation of Concerns:**
  - Route handlers (`app/api/**`): Handle request parsing, validation, orchestration, and response shaping. No embedded business logic.
  - Domain libraries (`lib/**`): Contain pure business logic, API clients, diff-parsing routines, and data transformers.
  - UI components (`components/**`): Presentational and client-side interactions only. Zero secret exposure or direct database access.
- **Predictable Error Handling:** Throw typed domain errors. Route handlers must catch errors, log actionable context, and return standardized HTTP error payloads.

## 3. Verification & Testing Mandates
- **Always Test Pure Utilities:** Maintain unit tests for diff-cleaning helpers, triage score gates, and data transformers using Vitest.
- **Mock External Boundaries:** Never make live calls to Gemini, GitHub, or Sanity within automated test suites. Mock all HTTP boundaries and SDK clients.
- **Verification Rule:** Always run `npm run type-check` (or `tsc --noEmit`) and `npm test` before concluding any code implementation or refactor and `npm run build`.

## 4. Linting & Formatting Hygiene
- **Zero-Warning Rule:** Code must pass ESLint and Prettier checks without suppressions (`eslint-disable`) or unresolved warnings.
- **Dead Code Elimination:** Remove unused imports, commented-out dead blocks, and debugging statements (`console.log`) before completing any task.
- **Fail Fast:** Validate required environment variables and configurations at system startup rather than deep within execution paths.