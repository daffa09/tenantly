-- Demo fixtures for the two tenants, for a manual paste into psql:
--   docker exec -i postgres psql -U postgres -d tenantly < seed.sql
--
-- Every account's password is: password123
-- The hash below is one bcrypt(cost 10) digest of it, reused for all four
-- users — fine for a demo, and it keeps this file copy-pasteable.
--
-- IDs are hardcoded UUIDs rather than gen_random_uuid() so the foreign keys
-- below can reference them without a CTE round-trip. The local equivalent is
-- `npm run seed` (backend/prisma/seed.ts); keep the two in step if you edit one.
--
-- DESTRUCTIVE: wipes all four tables first, so re-running gives a clean slate
-- instead of duplicate-key errors.

BEGIN;

TRUNCATE "Task", "Project", "User", "Company" CASCADE;

-- Tenant A: Acme Corp
INSERT INTO "Company" ("id", "name", "updatedAt") VALUES
  ('11111111-1111-4111-8111-111111111111', 'Acme Corp', NOW());

INSERT INTO "User" ("id", "email", "password", "name", "role", "companyId", "updatedAt") VALUES
  ('a1111111-1111-4111-8111-111111111111', 'admin@acme.com',  '$2b$10$joBmypYv0sWi26w6Ng7EO.qV85TvXKeKq3z0JBPBbzgdr6FRG5yOW', 'Alice (Acme Admin)',  'ADMIN',  '11111111-1111-4111-8111-111111111111', NOW()),
  ('a2222222-2222-4222-8222-222222222222', 'member@acme.com', '$2b$10$joBmypYv0sWi26w6Ng7EO.qV85TvXKeKq3z0JBPBbzgdr6FRG5yOW', 'Bob (Acme Member)',   'MEMBER', '11111111-1111-4111-8111-111111111111', NOW());

INSERT INTO "Project" ("id", "name", "description", "companyId", "updatedAt") VALUES
  ('a3333333-3333-4333-8333-333333333333', 'Acme Redesign', 'Main web redesign project for Acme Corp', '11111111-1111-4111-8111-111111111111', NOW());

INSERT INTO "Task" ("id", "title", "description", "status", "companyId", "projectId", "assigneeId", "updatedAt") VALUES
  ('a4444444-4444-4444-8444-444444444444', 'Design Wireframes',    'Create Figma wireframes for landing page', 'IN_PROGRESS', '11111111-1111-4111-8111-111111111111', 'a3333333-3333-4333-8333-333333333333', 'a2222222-2222-4222-8222-222222222222', NOW()),
  ('a5555555-5555-4555-8555-555555555555', 'Setup CI/CD Pipeline', 'Setup GitHub actions',                     'TODO',        '11111111-1111-4111-8111-111111111111', 'a3333333-3333-4333-8333-333333333333', 'a1111111-1111-4111-8111-111111111111', NOW());

-- Tenant B: Stark Industries. Exists so tenant isolation is visible: logging in
-- as Acme must never surface any row below.
INSERT INTO "Company" ("id", "name", "updatedAt") VALUES
  ('22222222-2222-4222-8222-222222222222', 'Stark Industries', NOW());

INSERT INTO "User" ("id", "email", "password", "name", "role", "companyId", "updatedAt") VALUES
  ('b1111111-1111-4111-8111-111111111111', 'admin@stark.com',  '$2b$10$joBmypYv0sWi26w6Ng7EO.qV85TvXKeKq3z0JBPBbzgdr6FRG5yOW', 'Tony Stark (Stark Admin)',    'ADMIN',  '22222222-2222-4222-8222-222222222222', NOW()),
  ('b2222222-2222-4222-8222-222222222222', 'member@stark.com', '$2b$10$joBmypYv0sWi26w6Ng7EO.qV85TvXKeKq3z0JBPBbzgdr6FRG5yOW', 'Peter Parker (Stark Member)', 'MEMBER', '22222222-2222-4222-8222-222222222222', NOW());

INSERT INTO "Project" ("id", "name", "description", "companyId", "updatedAt") VALUES
  ('b3333333-3333-4333-8333-333333333333', 'Jarvis Protocol', 'AI defense and automation system', '22222222-2222-4222-8222-222222222222', NOW());

INSERT INTO "Task" ("id", "title", "description", "status", "companyId", "projectId", "assigneeId", "updatedAt") VALUES
  ('b4444444-4444-4444-8444-444444444444', 'Calibrate Arc Reactor', 'Optimize power output', 'DONE', '22222222-2222-4222-8222-222222222222', 'b3333333-3333-4333-8333-333333333333', 'b2222222-2222-4222-8222-222222222222', NOW());

COMMIT;
