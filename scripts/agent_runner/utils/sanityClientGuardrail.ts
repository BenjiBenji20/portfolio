import type { SanityClient } from 'next-sanity';

/**
 * Scalable Sanity Client RBAC Guardrail
 * 
 * Enforces the Principle of Least Privilege on autonomous agents before any HTTP mutation:
 * 1. Zero Delete Authority: Unconditionally rejects all document deletions.
 * 2. Per-Schema RBAC: Verifies that target document schemas allow the requested mutation.
 * 3. Draft Isolation: Mandates that articles authored by agents must be drafts.
 */

export type AgentAction = 'read' | 'create' | 'patch' | 'delete';

export class SanitySecurityGuardrailException extends Error {
  constructor(message: string) {
    super(`[SanitySecurityGuardrail] ${message}`);
    this.name = 'SanitySecurityGuardrailException';
  }
}

/**
 * Schema Permission Registry (Single source of truth for agent access)
 * Add new schemas here with their permitted operations to scale permissions.
 */
export const SCHEMA_PERMISSIONS: Record<string, readonly AgentAction[]> = {
  // Safe write surfaces (Append/Edit only)
  workLog: ['read', 'create', 'patch'],
  project: ['read', 'create', 'patch'],
  article: ['read', 'create'], // Drafts only

  // Immutable Human-Only Surfaces (Strictly Read-Only for Agents)
  profile: ['read'],
  summaryOverview: ['read'],
  focusPillar: ['read'],
  experience: ['read'],
  blog: ['read'],
  contact: ['read'],
  emailContactInquiryTemplate: ['read'],
} as const;

/**
 * Asserts that an agent has explicit permission to execute an action on a target schema.
 */
export function assertAgentPermission(action: AgentAction, docType?: string, docId?: string): void {
  // 1. Invariant: Zero Delete Authority
  if (action === 'delete') {
    throw new SanitySecurityGuardrailException(
      `DESTRUCTIVE_ACTION_BLOCKED: Autonomous agents are unconditionally forbidden from calling delete() or purging documents (Target ID: '${docId || 'unknown'}').`
    );
  }

  if (!docType) {
    // If docType cannot be determined from a mutation payload, block to prevent ungrounded writes
    throw new SanitySecurityGuardrailException(
      `UNVERIFIED_SCHEMA_BLOCKED: Mutation rejected because document '_type' could not be verified.`
    );
  }

  // 2. Invariant: Known Schema Registry Check
  const allowedActions = SCHEMA_PERMISSIONS[docType];
  if (!allowedActions) {
    throw new SanitySecurityGuardrailException(
      `UNKNOWN_SCHEMA_BLOCKED: Schema '${docType}' is not registered in SCHEMA_PERMISSIONS. Add it to sanityClientGuardrail.ts before allowing agent access.`
    );
  }

  if (!allowedActions.includes(action)) {
    throw new SanitySecurityGuardrailException(
      `PERMISSION_DENIED: Agent is strictly forbidden from executing '${action}' on schema '${docType}'. Permitted actions: [${allowedActions.join(', ')}].`
    );
  }

  // 3. Invariant: Article Draft Isolation
  if (docType === 'article' && action === 'create' && docId && !docId.startsWith('drafts.')) {
    throw new SanitySecurityGuardrailException(
      `DRAFT_ISOLATION_VIOLATION: AI-generated articles must be created as drafts ('drafts.${docId}'). Automatic publishing is forbidden.`
    );
  }
}

/**
 * Creates a proxied Sanity client that intercepts mutations and enforces guardrails.
 */
export function createGuardedSanityClient(baseClient: SanityClient): SanityClient {
  return new Proxy(baseClient, {
    get(target, prop, receiver) {
      // 1. Intercept client.delete()
      if (prop === 'delete') {
        return (idOrSelection: unknown) => {
          const docId = typeof idOrSelection === 'string' ? idOrSelection : JSON.stringify(idOrSelection);
          assertAgentPermission('delete', undefined, docId);
        };
      }

      // 2. Intercept client.create()
      if (prop === 'create') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return async (doc: any, options?: any) => {
          assertAgentPermission('create', doc?._type, doc?._id);
          return target.create(doc, options);
        };
      }

      // 3. Intercept client.createOrReplace()
      if (prop === 'createOrReplace') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return async (doc: any, options?: any) => {
          assertAgentPermission('create', doc?._type, doc?._id);
          return target.createOrReplace(doc, options);
        };
      }

      // 4. Intercept client.createIfNotExists()
      if (prop === 'createIfNotExists') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return async (doc: any, options?: any) => {
          assertAgentPermission('create', doc?._type, doc?._id);
          return target.createIfNotExists(doc, options);
        };
      }

      // 5. Intercept client.patch()
      if (prop === 'patch') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (idOrDoc: any, ...args: any[]) => {
          const docId = typeof idOrDoc === 'string' ? idOrDoc : idOrDoc?._id;
          const docType = typeof idOrDoc === 'object' ? idOrDoc?._type : undefined;
          if (docType) {
            assertAgentPermission('patch', docType, docId);
          }
          return (target.patch as (...a: unknown[]) => unknown)(idOrDoc, ...args);
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  });
}

