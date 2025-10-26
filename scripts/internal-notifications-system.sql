-- Sistema de Notificaciones Internas (Sin dependencia de usuarios externos)
-- Para uso interno del equipo vía WhatsApp Web

-- Crear tabla de notificaciones internas
CREATE TABLE IF NOT EXISTS internal_notifications (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('critical', 'warning', 'info', 'success')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('property', 'agent', 'document', 'system', 'task', 'message')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_internal_notifications_read ON internal_notifications(read);
CREATE INDEX IF NOT EXISTS idx_internal_notifications_created_at ON internal_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_notifications_type ON internal_notifications(type);
CREATE INDEX IF NOT EXISTS idx_internal_notifications_category ON internal_notifications(category);

-- Crear tabla de configuración de notificaciones internas
CREATE TABLE IF NOT EXISTS internal_notification_config (
  id BIGSERIAL PRIMARY KEY,
  whatsapp_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  categories JSONB DEFAULT '{"property": true, "agent": true, "document": true, "system": true, "task": true, "message": true}'::jsonb,
  whatsapp_numbers TEXT[] DEFAULT ARRAY[]::TEXT[],
  email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de reportes generados (sin dependencia de usuarios)
CREATE TABLE IF NOT EXISTS internal_reports (
  id BIGSERIAL PRIMARY KEY,
  report_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  generated_by_name VARCHAR(255),
  file_url TEXT,
  file_size INTEGER,
  format VARCHAR(20) CHECK (format IN ('pdf', 'html', 'json', 'csv')),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('generating', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Crear índices para reportes
CREATE INDEX IF NOT EXISTS idx_internal_reports_created_at ON internal_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_reports_type ON internal_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_internal_reports_status ON internal_reports(status);

-- Crear tabla de plantillas de reportes
CREATE TABLE IF NOT EXISTS internal_report_templates (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(50) CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'on-demand')),
  enabled BOOLEAN DEFAULT TRUE,
  whatsapp_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  sections TEXT[] DEFAULT ARRAY[]::TEXT[],
  format VARCHAR(20) DEFAULT 'pdf' CHECK (format IN ('pdf', 'html', 'json', 'csv')),
  schedule_config JSONB DEFAULT '{}'::jsonb,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  next_scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función para crear notificación interna
CREATE OR REPLACE FUNCTION create_internal_notification(
  p_type VARCHAR,
  p_category VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT AS $$
DECLARE
  notification_id BIGINT;
BEGIN
  INSERT INTO internal_notifications (type, category, title, message, link, metadata)
  VALUES (p_type, p_category, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar notificación como leída
CREATE OR REPLACE FUNCTION mark_internal_notification_read(notification_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE internal_notifications
  SET read = TRUE, read_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar notificación como enviada por WhatsApp
CREATE OR REPLACE FUNCTION mark_whatsapp_sent(notification_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE internal_notifications
  SET whatsapp_sent = TRUE, whatsapp_sent_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Insertar configuración por defecto
INSERT INTO internal_notification_config (whatsapp_enabled, email_enabled)
VALUES (TRUE, FALSE)
ON CONFLICT DO NOTHING;
