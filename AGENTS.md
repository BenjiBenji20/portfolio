# Benjineer Portfolio - Agentic Blog Site

This document is the root entrypoint and navigation index for AI agents working in the Benjineer Portfolio site. Follow the routing table below to dynamically load specialized domain knowledge on-demand to maintain high accuracy and prevent context saturation.

---

## 1. Always-On Invariant Rules (`.agents/rules/`)

The rules in `.agents/rules/` are **unconditionally active** across all development activities:

---

## 2. Task-to-Document Routing Matrix

Before writing, analyzing, or refactoring code in any specific domain, **read the corresponding document first**:

---

## 3. Knowledge Directory Structure

All prompt documents are organized by purpose under `.agents/`:

---

## 4. Agent Operational Loop

1. **Identify**: Determine the domain and technical scope of the user request.
2. **Consult**: Read the relevant `.agents/` document(s) from the routing matrix above.
3. **Plan & Confirm**: Produce an artifact implementation plan if architectural changes are required.
4. **Execute**: Implement upon explicit approval adhering strictly to the documented domain patterns and invariants.

---

## 5. Dynamic Extension Protocol

When adding new prompts or skills to this repository:
1. Place the document in the appropriate `.agents/<category>/` directory.
2. Register a single-line entry in the **Task-to-Document Routing Matrix** above with the file path and core invariant.
3. Keep all individual prompt files focused, technical, and under their respective line limits.

---