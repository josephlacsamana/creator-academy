-- Fix: Admin RLS policies caused infinite recursion by querying users table inside users policy
-- Solution: Use auth.jwt() to check role instead of subquery

DROP POLICY IF EXISTS "Admin can read all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;

CREATE POLICY "Admin can read all users"
  ON users FOR SELECT
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.uid() = id
  );

CREATE POLICY "Admin can update all users"
  ON users FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.uid() = id
  );
