-- Real Estate Opportunities Portal Database Schema
-- Creates tables for opportunity management, tracking, and collaboration

-- 1. Opportunities Table - Main opportunity listings
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'lead' CHECK (status IN ('lead', 'contact', 'viewing', 'offer', 'negotiation', 'closed', 'lost')),
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('casa', 'terreno', 'comercial', 'departamento', 'otro')),
  price NUMERIC(15, 2),
  area_sqm NUMERIC(10, 2),
  bedrooms INT,
  bathrooms INT,
  location VARCHAR(255),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  images_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  owner_name VARCHAR(255),
  owner_email VARCHAR(255),
  owner_phone VARCHAR(20),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Opportunity Images Table - High-res image storage
CREATE TABLE IF NOT EXISTS opportunity_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  storage_path VARCHAR(500),
  display_order INT DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Opportunity Notes Table - Collaboration and history
CREATE TABLE IF NOT EXISTS opportunity_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'comment' CHECK (note_type IN ('comment', 'internal', 'alert', 'action')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_pinned BOOLEAN DEFAULT FALSE
);

-- 4. Opportunity Activity Table - Activity log for tracking
CREATE TABLE IF NOT EXISTS opportunity_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Saved Opportunities Table - User favorites/watchlist
CREATE TABLE IF NOT EXISTS opportunity_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- 6. Opportunity Filters/Alerts Table - User search preferences
CREATE TABLE IF NOT EXISTS opportunity_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filter_name VARCHAR(100),
  min_price NUMERIC(15, 2),
  max_price NUMERIC(15, 2),
  min_area NUMERIC(10, 2),
  max_area NUMERIC(10, 2),
  property_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  locations TEXT[] DEFAULT ARRAY[]::TEXT[],
  bedrooms INT,
  status_filter TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. User Roles Table - Team role management
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON opportunities(created_by);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_notes_opportunity_id ON opportunity_notes(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_saves_user_id ON opportunity_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opportunities table
CREATE POLICY "opportunities_select_policy" ON opportunities
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "opportunities_insert_policy" ON opportunities
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'analyst'))
  );

CREATE POLICY "opportunities_update_policy" ON opportunities
  FOR UPDATE USING (
    auth.uid() = created_by OR auth.uid() = assigned_to OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "opportunities_delete_policy" ON opportunities
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for notes
CREATE POLICY "notes_select_policy" ON opportunity_notes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "notes_insert_policy" ON opportunity_notes
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'analyst'))
  );

-- RLS Policies for saves
CREATE POLICY "saves_select_policy" ON opportunity_saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saves_insert_policy" ON opportunity_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saves_delete_policy" ON opportunity_saves
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "user_roles_select_policy" ON user_roles
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER opportunities_update_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER opportunity_notes_update_updated_at BEFORE UPDATE ON opportunity_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER opportunity_filters_update_updated_at BEFORE UPDATE ON opportunity_filters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
