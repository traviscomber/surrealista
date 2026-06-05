-- Create scheduled_visits table
CREATE TABLE IF NOT EXISTS public.scheduled_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  property_id UUID,
  visit_date TIMESTAMP NOT NULL,
  visit_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_point TEXT,
  description TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  broker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_visit_per_client_date UNIQUE(client_id, visit_date)
);

-- Create visit_checklists table
CREATE TABLE IF NOT EXISTS public.visit_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.scheduled_visits(id) ON DELETE CASCADE,
  item_title TEXT NOT NULL,
  item_description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create visit_evaluations table
CREATE TABLE IF NOT EXISTS public.visit_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.scheduled_visits(id) ON DELETE CASCADE,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  aspects_liked TEXT,
  aspects_disliked TEXT,
  offer_probability VARCHAR(50),
  next_steps TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT one_evaluation_per_visit UNIQUE(visit_id)
);

-- Enable RLS on all tables
ALTER TABLE public.scheduled_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_visits
CREATE POLICY "Users can view their own visits" ON public.scheduled_visits
  FOR SELECT USING (auth.uid() = broker_id);

CREATE POLICY "Users can create visits" ON public.scheduled_visits
  FOR INSERT WITH CHECK (auth.uid() = broker_id);

CREATE POLICY "Users can update their own visits" ON public.scheduled_visits
  FOR UPDATE USING (auth.uid() = broker_id);

CREATE POLICY "Users can delete their own visits" ON public.scheduled_visits
  FOR DELETE USING (auth.uid() = broker_id);

-- RLS Policies for visit_checklists
CREATE POLICY "Users can access checklists for their visits" ON public.visit_checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_visits 
      WHERE id = visit_id AND broker_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify checklists for their visits" ON public.visit_checklists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scheduled_visits 
      WHERE id = visit_id AND broker_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checklists for their visits" ON public.visit_checklists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_visits 
      WHERE id = visit_id AND broker_id = auth.uid()
    )
  );

-- RLS Policies for visit_evaluations
CREATE POLICY "Users can access evaluations for their visits" ON public.visit_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_visits 
      WHERE id = visit_id AND broker_id = auth.uid()
    )
  );

CREATE POLICY "Users can create evaluations for their visits" ON public.visit_evaluations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scheduled_visits 
      WHERE id = visit_id AND broker_id = auth.uid()
    )
  );

CREATE POLICY "Users can update evaluations for their visits" ON public.visit_evaluations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_visits 
      WHERE id = visit_id AND broker_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_visits_client ON public.scheduled_visits(client_id);
CREATE INDEX idx_visits_broker ON public.scheduled_visits(broker_id);
CREATE INDEX idx_visits_date ON public.scheduled_visits(visit_date);
CREATE INDEX idx_checklists_visit ON public.visit_checklists(visit_id);
CREATE INDEX idx_evaluations_visit ON public.visit_evaluations(visit_id);
