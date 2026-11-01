import { createClient } from 'next-sanity';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      let val = match[2].trim();
      if (val.includes('#') && !val.startsWith('"') && !val.startsWith("'")) {
        val = val.split('#')[0].trim();
      }
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[match[1].trim()] = val;
    }
  }
  return result;
}

const v1Env = loadEnvFile(path.resolve(process.cwd(), '.env'));
const v2Env = loadEnvFile(path.resolve(process.cwd(), '.env.local'));

export const v1Config = {
  projectId: v1Env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: v1Env.NEXT_PUBLIC_SANITY_DATABASE || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
};

export const v2Config = {
  projectId: v2Env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: v2Env.NEXT_PUBLIC_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: v2Env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
};

/**
 * Strict Read-Only Client for Sanity Portfolio v1.
 * Unauthenticated / No Write Token ensures zero mutation risk.
 */
export const v1Client = createClient(v1Config);

/**
 * Read-Write Client for Sanity Portfolio v2.
 * Authenticated with SANITY_API_WRITE_TOKEN for target migrations.
 */
export const v2Client = createClient(v2Config);
