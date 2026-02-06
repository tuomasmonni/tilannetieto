-- ============================================
-- Tilannetieto.fi — Auth & Roadmap Migration
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Roadmap items table
CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'feature' CHECK (category IN ('feature', 'improvement', 'integration', 'ui', 'data')),
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'planned', 'in_progress', 'completed', 'rejected')),
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_official BOOLEAN DEFAULT false,
  vote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Votes table
CREATE TABLE IF NOT EXISTS roadmap_votes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES roadmap_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_roadmap_items_status ON roadmap_items(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_vote_count ON roadmap_items(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_item ON roadmap_votes(item_id);

-- 5. Vote count trigger
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE roadmap_items SET vote_count = vote_count + 1 WHERE id = NEW.item_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE roadmap_items SET vote_count = vote_count - 1 WHERE id = OLD.item_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_change ON roadmap_votes;
CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON roadmap_votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_count();

-- 6. RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_votes ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles: read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles: update own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Roadmap items
CREATE POLICY "Items: read" ON roadmap_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Items: create" ON roadmap_items FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Items: admin update" ON roadmap_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Items: admin delete" ON roadmap_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Votes
CREATE POLICY "Votes: read own" ON roadmap_votes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Votes: create" ON roadmap_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Votes: delete own" ON roadmap_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 7. Seed: sample roadmap items (optional — remove if not wanted)
INSERT INTO roadmap_items (title, description, category, status, is_official, vote_count) VALUES
  ('Reaaliaikainen joukkoliikenne', 'HSL:n ja muiden kaupunkien bussit ja ratikat kartalla reaaliajassa.', 'integration', 'planned', true, 15),
  ('Sääkartta (FMI)', 'Ilmatieteen laitoksen reaaliaikaiset säähavainnot ja ennusteet kartalle.', 'integration', 'in_progress', true, 22),
  ('Tumma/vaalea karttatyyli', 'Mahdollisuus vaihtaa kartan tyyliä tumman ja vaalean välillä.', 'ui', 'proposed', true, 8),
  ('Väestötiheys-heatmap', 'Väestötiheyden visualisointi heatmap-kerroksena kartalle.', 'data', 'proposed', true, 12),
  ('Push-ilmoitukset', 'Ilmoitukset tärkeistä liikennetapahtumista tai poikkeustilanteista.', 'feature', 'proposed', false, 5)
ON CONFLICT DO NOTHING;
