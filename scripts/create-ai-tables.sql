-- Crear tablas para el sistema de IA en Sur-Realista

-- Tabla para documentos generados por IA
CREATE TABLE IF NOT EXISTS ai_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    related_entity_id UUID,
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft',
    version INTEGER DEFAULT 1
);

-- Tabla para agentes de IA
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    description TEXT,
    capabilities TEXT[] DEFAULT '{}',
    model VARCHAR(50) NOT NULL,
    parameters JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_run TIMESTAMP WITH TIME ZONE,
    success_rate DECIMAL(5,2),
    training_data JSONB
);

-- Tabla para modelos de IA
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}',
    training_status VARCHAR(20) DEFAULT 'not-trained',
    accuracy DECIMAL(5,2),
    last_trained_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para flujos de trabajo de IA
CREATE TABLE IF NOT EXISTS ai_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_run TIMESTAMP WITH TIME ZONE,
    average_runtime INTEGER,
    success_rate DECIMAL(5,2)
);

-- Tabla para pasos de flujos de trabajo
CREATE TABLE IF NOT EXISTS ai_workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES ai_workflows(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    agent_id UUID REFERENCES ai_agents(id),
    parameters JSONB DEFAULT '{}',
    "order" INTEGER NOT NULL,
    depends_on UUID[],
    timeout INTEGER DEFAULT 30000,
    retry_count INTEGER DEFAULT 0,
    status VARCHAR(20)
);

-- Tabla para disparadores de flujos de trabajo
CREATE TABLE IF NOT EXISTS ai_workflow_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES ai_workflows(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    schedule VARCHAR(100),
    event_type VARCHAR(50),
    event_filter JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT FALSE
);

-- Tabla para análisis de IA
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    data JSONB NOT NULL,
    results JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'pending',
    related_entity_id UUID,
    model_id UUID REFERENCES ai_models(id)
);

-- Tabla para visualizaciones de análisis
CREATE TABLE IF NOT EXISTS ai_visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES ai_analyses(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    data JSONB NOT NULL
);

-- Tabla para insights de análisis
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES ai_analyses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    importance VARCHAR(20) NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    related_insights UUID[]
);

-- Tabla para eventos de IA
CREATE TABLE IF NOT EXISTS ai_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB NOT NULL,
    source VARCHAR(100) NOT NULL
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ai_documents_type ON ai_documents(type);
CREATE INDEX IF NOT EXISTS idx_ai_documents_status ON ai_documents(status);
CREATE INDEX IF NOT EXISTS idx_ai_documents_related_entity ON ai_documents(related_entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_role ON ai_agents(role);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_type ON ai_workflows(type);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_status ON ai_workflows(status);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_status ON ai_analyses(status);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_related_entity ON ai_analyses(related_entity_id);

-- Funciones para actualizar automáticamente los timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar automáticamente los timestamps
CREATE TRIGGER update_ai_documents_updated_at
BEFORE UPDATE ON ai_documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_agents_updated_at
BEFORE UPDATE ON ai_agents
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_models_updated_at
BEFORE UPDATE ON ai_models
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_workflows_updated_at
BEFORE UPDATE ON ai_workflows
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_analyses_updated_at
BEFORE UPDATE ON ai_analyses
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
