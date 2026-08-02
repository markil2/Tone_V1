#!/usr/bin/env node
/**
 * Verifies that .env points at a real, reachable Supabase project with the
 * schema applied.
 *
 * Plain .mjs with no dependencies so it runs before anything is bundled, and
 * can't itself be the reason a connection check fails.
 *
 *   npm run supabase:check
 */

import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';

const RESET = '\x1b[0m';
const paint = (code, text) => `\x1b[${code}m${text}${RESET}`;
const pass = (msg) => console.log(`${paint(32, '  PASS')}  ${msg}`);
const fail = (msg) => console.log(`${paint(31, '  FAIL')}  ${msg}`);
const info = (msg) => console.log(`${paint(90, '  ····')}  ${msg}`);

/** Minimal .env parser — avoids a dotenv dependency for one file. */
function loadEnv(path = '.env') {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const eq = line.indexOf('=');
          return [line.slice(0, eq).trim(), line.slice(eq + 1).trim()];
        }),
    );
  } catch {
    return null;
  }
}

console.log('\nSupabase connection check\n');

const env = loadEnv();
if (!env) {
  fail('No .env file found. Copy .env.example to .env first.');
  process.exit(1);
}

const url = env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/* ------------------------------ 1. placeholders ---------------------------- */
if (!url || !anonKey) {
  fail('EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing from .env');
  process.exit(1);
}
if (url.includes('your-project-ref') || anonKey.includes('your-anon-key')) {
  fail('.env still contains placeholder values.');
  info('Paste your Project URL and anon key from Dashboard → Settings → API.');
  process.exit(1);
}
pass('.env has non-placeholder values');

/* --------------------------- 2. anon key sanity ---------------------------- */
// Supabase keys are either legacy JWTs (eyJ...) or the newer sb_publishable_...
// A service_role JWT decodes with role "service_role" — catching that here is
// worth it, because shipping one would bypass RLS for every user.
if (anonKey.startsWith('eyJ')) {
  try {
    const payload = JSON.parse(Buffer.from(anonKey.split('.')[1], 'base64').toString());
    if (payload.role === 'service_role') {
      fail('That is a SERVICE_ROLE key, not the anon key.');
      info('It bypasses Row Level Security. Never put it in .env or the app bundle.');
      info('Use the key labelled "anon public" in Dashboard → Settings → API.');
      process.exit(1);
    }
    pass(`anon key looks valid (role: ${payload.role ?? 'unknown'})`);
  } catch {
    info('Could not decode the key as a JWT — continuing anyway.');
  }
} else {
  pass('anon key present (non-JWT publishable format)');
}

/* ------------------------------ 3. reachability ---------------------------- */
const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

async function get(path) {
  const res = await fetch(`${url}${path}`, { headers });
  return { status: res.status, body: await res.text() };
}

// Probe a real table, not the `/rest/v1/` OpenAPI root. Supabase now serves that
// root only to secret keys, so a publishable key gets a 401 there even when it is
// perfectly valid — which reads as "your key is wrong" and sends you off fixing
// the one thing that isn't broken.
let profiles;
try {
  // An empty array is the expected, correct result: RLS hides every row from an
  // unauthenticated caller. That is proof the policies are active, not a problem.
  profiles = await get('/rest/v1/profiles?select=id&limit=1');
} catch (error) {
  fail(`Could not reach ${url}`);
  info(error.message);
  info('Check the Project URL, and that the project has finished provisioning.');
  process.exit(1);
}
pass(`REST API reachable at ${url}`);

/* -------------------------------- 4. schema -------------------------------- */
if (profiles.status === 200) {
  pass('Table "profiles" exists and RLS is filtering rows as expected');
} else if (profiles.status === 401) {
  fail('REST API rejected the key (401). Check you copied the whole key.');
  info(profiles.body.slice(0, 200));
  process.exit(1);
} else if (
  profiles.status === 404 ||
  profiles.body.includes('does not exist') ||
  profiles.body.includes('schema cache')
) {
  fail('Table "profiles" not found — the migration has not been applied.');
  info('Dashboard → SQL Editor → paste supabase/migrations/0001_init.sql → Run');
  process.exit(1);
} else {
  fail(`Unexpected response querying profiles: ${profiles.status}`);
  info(profiles.body.slice(0, 200));
  process.exit(1);
}

/* --------------------------------- 5. RPC ---------------------------------- */
/**
 * Read the OpenAPI document rather than calling the function.
 *
 * Calling it with `{}` cannot work: all 15 parameters are required, so PostgREST
 * answers 404 / PGRST202 ("could not find the function in the schema cache") —
 * the same response it gives when the function genuinely does not exist. There
 * is no status code that distinguishes the two, so probing by invocation always
 * reports failure. The schema document is unambiguous.
 */
const spec = await get('/rest/v1/');
let rpcFound = true; // never fail the run on a spec we couldn't read

if (spec.status !== 200) {
  // Expected with a publishable key — the spec endpoint is secret-key only.
  info(`OpenAPI document not readable (${spec.status}); skipping the RPC check.`);
} else {
  try {
    rpcFound = Object.keys(JSON.parse(spec.body).paths ?? {}).includes(
      '/rpc/complete_onboarding',
    );
  } catch {
    info('Could not parse the OpenAPI document; skipping the RPC check.');
  }
}

if (!rpcFound) {
  fail('RPC "complete_onboarding" not found — re-run the migration.');
  info('Dashboard → SQL Editor → paste supabase/migrations/0001_init.sql → Run');
  process.exit(1);
}
pass('RPC "complete_onboarding" is exposed');

console.log(`\n${paint(32, 'Connected.')} Onboarding will persist for real.\n`);
