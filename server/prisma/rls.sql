-- Enable Row Level Security on all tables.
-- Run this once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vzztucqqyiojctqzqkst/sql/new
--
-- The Express backend connects as the 'postgres' superuser which bypasses RLS,
-- so the app is unaffected. This blocks Supabase's auto-generated REST API
-- (PostgREST via anon/authenticated roles) from reading any table directly.

ALTER TABLE "User"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailVerificationCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceMember"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Media"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiRequestLog"         ENABLE ROW LEVEL SECURITY;
