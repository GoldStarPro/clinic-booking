#!/usr/bin/env node

/**
 * Static lint for the canonical Supabase RLS SQL.
 *
 * Expects exactly one active migration:
 *   supabase/migrations/*rls_canonical.sql
 *
 * Checks:
 * - helpers live in private schema (not public RPC)
 * - search_path is set on helper functions
 * - no GRANT ALL ON ALL TABLES
 * - no USING (true) for anon/authenticated
 * - auth.* wrapped in (select ...)
 * - _prisma_migrations locked down
 * - pg_graphql dropped / not relied upon in public API
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations')

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[36m'
const RESET = '\x1b[0m'

let failed = 0
let warnings = 0

function fail(msg) {
  console.log(`${RED}✗${RESET} ${msg}`)
  failed++
}

function warn(msg) {
  console.log(`${YELLOW}⚠${RESET} ${msg}`)
  warnings++
}

function ok(msg) {
  console.log(`${GREEN}✓${RESET} ${msg}`)
}

function stripSqlComments(sql) {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

console.log(`${BLUE}═══════════════════════════════════════════${RESET}`)
console.log(`${BLUE}   Supabase SQL Security Lint${RESET}`)
console.log(`${BLUE}═══════════════════════════════════════════${RESET}\n`)

if (!fs.existsSync(MIGRATIONS_DIR)) {
  fail(`Missing migrations dir: ${MIGRATIONS_DIR}`)
  process.exit(1)
}

const files = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()

if (files.length === 0) {
  fail('No SQL migration files found in supabase/migrations/')
  process.exit(1)
}

if (files.length > 1) {
  warn(
    `Expected 1 active SQL file, found ${files.length}: ${files.join(', ')}. Archive old files under supabase/archive/.`
  )
}

const canonical = files.find((f) => f.includes('rls_canonical')) || files[files.length - 1]
if (!canonical.includes('rls_canonical')) {
  fail('Missing *rls_canonical.sql — clone/setup should use one canonical RLS file')
} else {
  ok(`Canonical RLS file: ${canonical}`)
}

const sqlRaw = fs.readFileSync(path.join(MIGRATIONS_DIR, canonical), 'utf8')
const sql = stripSqlComments(sqlRaw)

console.log(`\nLinting: ${canonical}\n`)

// Helpers in private schema
if (!/CREATE\s+SCHEMA\s+IF\s+NOT\s+EXISTS\s+private/i.test(sql)) {
  fail('Missing private schema for helper functions')
} else {
  ok('Uses private schema for helpers')
}

if (!/FUNCTION\s+private\.(current_uid|is_admin|is_doctor)/i.test(sql)) {
  fail('Helpers should be private.current_uid / private.is_admin / private.is_doctor')
} else {
  ok('Helper functions defined under private.*')
}

if (/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.(is_admin|is_doctor|current_uid)/i.test(sql)) {
  fail('Do not define SECURITY DEFINER helpers in public (exposes /rest/v1/rpc)')
} else {
  ok('No public.is_admin / public.is_doctor / public.current_uid definitions')
}

// search_path
const fnBlocks = sqlRaw.split(/CREATE\s+OR\s+REPLACE\s+FUNCTION/i).slice(1)
let missingSearchPath = 0
for (const block of fnBlocks) {
  const name = (block.match(/^\s*([\w.]+)/) || [])[1] || '(unknown)'
  if (!/SET\s+search_path\s*=/i.test(block)) {
    missingSearchPath++
    fail(`${name}: missing SET search_path`)
  }
}
if (missingSearchPath === 0) {
  ok('All helper functions set search_path')
}

// REVOKE FROM PUBLIC on functions
if (!/REVOKE\s+ALL\s+ON\s+FUNCTION\s+private\./i.test(sql)) {
  fail('Revoke EXECUTE/ALL on private helpers FROM PUBLIC')
} else {
  ok('Revokes function privileges from PUBLIC')
}

// Bare auth.* (allow inside (SELECT auth.uid()))
const lines = sqlRaw.split(/\r?\n/)
let bareAuth = 0
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const trimmed = line.trim()
  if (trimmed.startsWith('--')) continue
  if (!/auth\.(uid|jwt|role)\s*\(/i.test(line)) continue
  if (/\(\s*select\s+auth\.(uid|jwt|role)\s*\(/i.test(line)) continue
  if (/select\s+auth\.(uid|jwt|role)\s*\(/i.test(line)) continue
  bareAuth++
  fail(`${canonical}:${i + 1} bare auth.*() — use (select auth.uid())`)
}
if (bareAuth === 0) ok('Auth calls wrapped for Init Plan')

// USING (true) for anon/authenticated
const policyBlocks = sql.split(/CREATE POLICY/i).slice(1)
let alwaysTrue = 0
for (const block of policyBlocks) {
  const toMatch = block.match(/TO\s+([^\n]+)/i)
  const roles = (toMatch?.[1] || '').toLowerCase()
  const serviceOnly =
    roles.includes('service_role') &&
    !roles.includes('authenticated') &&
    !roles.includes('anon')
  if (serviceOnly) continue
  if (/\b(authenticated|anon)\b/i.test(roles)) {
    if (/USING\s*\(\s*true\s*\)/i.test(block) || /WITH CHECK\s*\(\s*true\s*\)/i.test(block)) {
      alwaysTrue++
      fail('Policy has USING/WITH CHECK (true) for anon/authenticated')
    }
  }
}
if (alwaysTrue === 0) ok('No always-true policies for anon/authenticated')

if (/GRANT\s+ALL\s+ON\s+ALL\s+TABLES\s+IN\s+SCHEMA\s+public/i.test(sql)) {
  fail('GRANT ALL ON ALL TABLES re-exposes internal tables')
} else {
  ok('No GRANT ALL ON ALL TABLES')
}

if (!/_prisma_migrations/i.test(sql) || !/ENABLE ROW LEVEL SECURITY/i.test(sql)) {
  fail('Must lock down _prisma_migrations with RLS')
} else {
  ok('_prisma_migrations lockdown present')
}

// Appointment must not grant to anon
if (/GRANT\s+[^;]*ON\s+TABLE\s+public\."Appointment"[^;]*\bTO\b[^;]*\banon\b/i.test(sql)) {
  fail('Do not GRANT Appointment privileges to anon')
} else {
  ok('Appointment not granted to anon')
}

if (!/DROP\s+EXTENSION\s+IF\s+EXISTS\s+pg_graphql/i.test(sql)) {
  warn('Consider DROP EXTENSION pg_graphql — clears GraphQL schema exposure warnings')
} else {
  ok('Drops pg_graphql (app uses REST / supabase-js only)')
}

console.log(`\n${BLUE}───────────────────────────────────────────${RESET}`)
console.log(`Failed: ${failed}  Warnings: ${warnings}`)

if (failed > 0) {
  console.log(`\n${RED}Supabase SQL security lint failed.${RESET}`)
  process.exit(1)
}

console.log(`\n${GREEN}Supabase SQL security lint passed.${RESET}`)
process.exit(0)
