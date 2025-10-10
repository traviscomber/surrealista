-- Safe migration script that only adds missing columns to existing tables
-- This script is idempotent and can be run multiple times safely

-- Add any missing columns to the clients table
DO $$ 
BEGIN
    -- Check and add second_last_name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'second_last_name'
    ) THEN
        ALTER TABLE clients ADD COLUMN second_last_name VARCHAR(100);
    END IF;

    -- Check and add desired_surface_area_min if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'desired_surface_area_min'
    ) THEN
        ALTER TABLE clients ADD COLUMN desired_surface_area_min DECIMAL(10, 2);
    END IF;

    -- Check and add desired_surface_area_max if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'desired_surface_area_max'
    ) THEN
        ALTER TABLE clients ADD COLUMN desired_surface_area_max DECIMAL(10, 2);
    END IF;

    -- Check and add budget_min if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'budget_min'
    ) THEN
        ALTER TABLE clients ADD COLUMN budget_min DECIMAL(15, 2);
    END IF;

    -- Check and add budget_max if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'budget_max'
    ) THEN
        ALTER TABLE clients ADD COLUMN budget_max DECIMAL(15, 2);
    END IF;

    -- Check and add locations_of_interest if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'locations_of_interest'
    ) THEN
        ALTER TABLE clients ADD COLUMN locations_of_interest TEXT[];
    END IF;

    -- Check and add related_documents if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'related_documents'
    ) THEN
        ALTER TABLE clients ADD COLUMN related_documents JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add any missing columns to the tasks table
DO $$ 
BEGIN
    -- Check and add related_to if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'related_to'
    ) THEN
        ALTER TABLE tasks ADD COLUMN related_to VARCHAR(50);
    END IF;

    -- Check and add related_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'related_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN related_id UUID;
    END IF;

    -- Check and add location if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'location'
    ) THEN
        ALTER TABLE tasks ADD COLUMN location VARCHAR(255);
    END IF;

    -- Check and add tags if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'tags'
    ) THEN
        ALTER TABLE tasks ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_related_to ON tasks(related_to, related_id);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_rut ON clients(rut);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_main_interest ON clients(main_interest);

CREATE INDEX IF NOT EXISTS idx_client_property_relationships_client ON client_property_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_property_relationships_property ON client_property_relationships(property_id);
CREATE INDEX IF NOT EXISTS idx_client_property_relationships_type ON client_property_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_client_communications_client ON client_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_type ON client_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_client_communications_date ON client_communications(communication_date);
