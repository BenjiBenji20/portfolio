---
trigger: always_on
---

---
trigger: always_on
---

# WORKFLOW EXECUTION RULES & SAFETY CONSTRAINTS

### 1. Read Prompts (Fresh Conversation Start vs Problem Contexts)

**Fresh conversation start:**
- Read `AGENTS.md` as part of this pass.

**Problem contexts (after the initial read):**
- Use `AGENTS.md` as the navigation index. Do NOT re-read every prompt in `.agents/`.
- Go to the index, find the prompts relevant to the current problem, and re-contextualize only those.
- If the problem shifts to a new area, return to the index and load only the newly relevant prompts.

**Files:**
- **`AGENTS.md`**: Root entrypoint and navigation index for AI agents. Use it to jump straight to the prompts a problem needs, so you don't re-read unnecessary ones and waste tokens.
- **`.agents/`**: Complete prompt collection.
- **`documentation/**: Detailed system documentation.

### 2. STRICT READ-ONLY GIT POLICY
- **Permitted Git Commands:** Only non-mutating inspection commands are allowed (`git status`, `git log`, `git diff`, `git branch --list`).
- **Prohibited Git Commands:** Under no circumstances should you run commands that alter repository history, remotes, or state. Strictly prohibited: `git commit`, `git push`, `git pull`, `git merge`, `git rebase`, `git reset`, `git checkout -b`, `git stash pop`, `git cherry-pick`, or `git tag`.
- **Operator Authority:** Git staging, commits, branch management, and remote sync remain exclusively under human developer control.

### 3. MANDATORY ARTIFACT-FIRST PLANNING
- **No Premature Coding:** Never create, edit, or delete source files, configuration files, or sanity document before presenting a complete plan.
- **Structured Plan Scope:** Every architectural change, refactor, or new feature must first be documented in a structured artifact / plan specification detailing (not fixed to follow):
  1. Scope and target files affected.
  2. Report findings.
  3. Detailed implementation/recommendation/solution plan.
  4. Step-by-step implementation sequence.
  5. Potential regression risks and validation test plan.

### 4. EXPLICIT HUMAN APPROVAL GATE
- **Strict Halt:** After generating or updating an implementation plan artifact, halt execution immediately.
- **No Unsolicited Next Steps:** Do not begin coding based on assumptions. Prompt the user directly and wait for unambiguous, explicit confirmation (e.g., "Plan approved", "Proceed") before writing any implementation code.

### 5. MAINTAINING CODE CLEANLINESS
- **Delete the dead code:** During refactor, implementation or fix, if the blocks of code, function or class was not necessary to the system, report your action if going to delete it.
- **Refactor instead of creating a new:** If we are refactoring a code, refactor it. Do NOT create a new and dead code.

### 6. DOCUMENTATION 
- **My Github Workflow:** I'll always create a new branch per features. When I'm done, I'll create a pull request and merged it myself.

- **What I'd Expect to You:** Every merged branch, you'll update the `README.md` IF an updates is necessary to document for future reference.

Every implementations such as security, new/update features, sanity schema, architecture, etc... will also be written in documentation/.

Each documentation are written in separate md file, with structured sections, short header and overview (with date start written), diagrams (mermaid. If only necessary.) and maximum of 80 lines only. (except big features that needs more space to be explained).