-- Tabla para Oportunidades Rápidas
CREATE TABLE IF NOT EXISTS quick_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  location VARCHAR(255),
  hectares DECIMAL(10, 2),
  property_type VARCHAR(100),
  asking_price DECIMAL(15, 2),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, closed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT quick_opportunities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_quick_opportunities_user_id ON quick_opportunities(user_id);
CREATE INDEX idx_quick_opportunities_status ON quick_opportunities(status);
CREATE INDEX idx_quick_opportunities_created_at ON quick_opportunities(created_at DESC);

-- RLS Policies
ALTER TABLE quick_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quick opportunities"
  ON quick_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quick opportunities"
  ON quick_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick opportunities"
  ON quick_opportunities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick opportunities"
  ON quick_opportunities FOR DELETE
  USING (auth.uid() = user_id);
