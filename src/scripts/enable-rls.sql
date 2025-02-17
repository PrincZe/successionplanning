-- Enable RLS on all tables
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_successors ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ooa_stints ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_stints ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Enable read access for all users" ON officers FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON positions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON hr_competencies FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON position_successors FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON officer_competencies FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON ooa_stints FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON officer_stints FOR SELECT USING (true);

-- Create policies for insert/update/delete (restrict to authenticated users)
CREATE POLICY "Enable insert for authenticated users only" ON officers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON officers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON officers FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON positions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON positions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON positions FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON hr_competencies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON hr_competencies FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON hr_competencies FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON position_successors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON position_successors FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON position_successors FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON officer_competencies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON officer_competencies FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON officer_competencies FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON ooa_stints FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON ooa_stints FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON ooa_stints FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON officer_stints FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON officer_stints FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON officer_stints FOR DELETE USING (auth.role() = 'authenticated'); 