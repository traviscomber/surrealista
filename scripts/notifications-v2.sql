-- ============================================
-- SISTEMA DE NOTIFICACIONES V2
-- Script completo y limpio sin dependencias
-- ============================================

-- Eliminar tablas existentes si hay conflictos
DROP TABLE IF EXISTS user_notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notification_history CASCADE;

-- Tabla principal de notificaciones
CREATE TABLE user_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de preferencias de notificaciones
CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    property_updates BOOLEAN DEFAULT TRUE,
    agent_messages BOOLEAN DEFAULT TRUE,
    system_alerts BOOLEAN DEFAULT TRUE,
    marketing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de historial de notificaciones
CREATE TABLE notification_history (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT REFERENCES user_notifications(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para optimizar consultas
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX idx_user_notifications_type ON user_notifications(notification_type);
CREATE INDEX idx_notification_history_notification_id ON notification_history(notification_id);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp automáticamente
CREATE TRIGGER update_user_notifications_timestamp
    BEFORE UPDATE ON user_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_timestamp();

CREATE TRIGGER update_notification_preferences_timestamp
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_timestamp();

-- Función para marcar notificación como leída
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE id = notification_id;
    
    INSERT INTO notification_history (notification_id, action)
    VALUES (notification_id, 'read');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función para crear nueva notificación
CREATE OR REPLACE FUNCTION add_user_notification(
    p_user_id BIGINT,
    p_type VARCHAR,
    p_category VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT AS $$
DECLARE
    new_notification_id BIGINT;
BEGIN
    INSERT INTO user_notifications (
        user_id, notification_type, category, title, message, link, metadata
    )
    VALUES (
        p_user_id, p_type, p_category, p_title, p_message, p_link, p_metadata
    )
    RETURNING id INTO new_notification_id;
    
    INSERT INTO notification_history (notification_id, action)
    VALUES (new_notification_id, 'created');
    
    RETURN new_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener notificaciones no leídas
CREATE OR REPLACE FUNCTION get_unread_notifications(p_user_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    notification_type VARCHAR,
    category VARCHAR,
    title VARCHAR,
    message TEXT,
    link TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.notification_type,
        n.category,
        n.title,
        n.message,
        n.link,
        n.metadata,
        n.created_at
    FROM user_notifications n
    WHERE n.user_id = p_user_id AND n.is_read = FALSE
    ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Habilitar Row Level Security
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_notifications
CREATE POLICY "Users can view their own notifications"
    ON user_notifications FOR SELECT
    USING (user_id = (SELECT id FROM users WHERE id = auth.uid()::bigint));

CREATE POLICY "Users can update their own notifications"
    ON user_notifications FOR UPDATE
    USING (user_id = (SELECT id FROM users WHERE id = auth.uid()::bigint));

-- Políticas RLS para notification_preferences
CREATE POLICY "Users can view their own preferences"
    ON notification_preferences FOR SELECT
    USING (user_id = (SELECT id FROM users WHERE id = auth.uid()::bigint));

CREATE POLICY "Users can update their own preferences"
    ON notification_preferences FOR UPDATE
    USING (user_id = (SELECT id FROM users WHERE id = auth.uid()::bigint));

CREATE POLICY "Users can insert their own preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (user_id = (SELECT id FROM users WHERE id = auth.uid()::bigint));

-- Políticas RLS para notification_history
CREATE POLICY "Users can view history of their notifications"
    ON notification_history FOR SELECT
    USING (
        notification_id IN (
            SELECT id FROM user_notifications 
            WHERE user_id = (SELECT id FROM users WHERE id = auth.uid()::bigint)
        )
    );

-- Insertar preferencias por defecto para usuarios existentes
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;
