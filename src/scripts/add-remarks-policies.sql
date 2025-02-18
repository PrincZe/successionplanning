-- First, disable RLS to reset policies
ALTER TABLE officer_remarks DISABLE ROW LEVEL SECURITY;

-- Then enable RLS again
ALTER TABLE officer_remarks ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all users to read remarks
CREATE POLICY "Allow all users to read remarks"
ON officer_remarks FOR SELECT
USING (true);

-- Create a policy to allow service role to insert remarks
CREATE POLICY "Allow service role to insert remarks"
ON officer_remarks FOR INSERT
WITH CHECK (true);

-- Create a policy to allow service role to update remarks
CREATE POLICY "Allow service role to update remarks"
ON officer_remarks FOR UPDATE
USING (true);

-- Create a policy to allow service role to delete remarks
CREATE POLICY "Allow service role to delete remarks"
ON officer_remarks FOR DELETE
USING (true); 