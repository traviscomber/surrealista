-- Creating AI-related tables
-- AI and ML features schema
-- Version: 002
-- Created: 2024-01-02

-- AI analysis results
CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,
    input_data JSONB,
    results JSONB,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document processing
CREATE TABLE IF NOT EXISTS document_processing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_url TEXT,
    extracted_data JSONB,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- AI chat messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_analysis_property_id ON ai_analysis(property_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_property_id ON document_processing(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON ai_messages(user_id);
