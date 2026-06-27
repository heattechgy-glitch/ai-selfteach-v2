-- Migration: 001_init.sql
-- Description: Initial schema setup for AI-SelfTeach-v2
-- Tables: task_executions, knowledge_library, improvement_plans

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: task_executions
-- Tracks all task executions with their inputs, outputs, and performance metrics
-- ============================================
CREATE TABLE IF NOT EXISTS task_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_type VARCHAR(255) NOT NULL,
    input JSONB NOT NULL DEFAULT '{}',
    output JSONB,
    success BOOLEAN NOT NULL DEFAULT false,
    error_log TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for task_executions
CREATE INDEX idx_task_executions_task_type ON task_executions(task_type);
CREATE INDEX idx_task_executions_success ON task_executions(success);
CREATE INDEX idx_task_executions_created_at ON task_executions(created_at DESC);

-- ============================================
-- Table: knowledge_library
-- Stores learned solutions and patterns for different problem families
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_family VARCHAR(255) NOT NULL,
    solution JSONB NOT NULL,
    source VARCHAR(500),
    confidence DECIMAL(5, 4) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    occurrence_count INTEGER NOT NULL DEFAULT 1 CHECK (occurrence_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for knowledge_library
CREATE INDEX idx_knowledge_library_problem_family ON knowledge_library(problem_family);
CREATE INDEX idx_knowledge_library_confidence ON knowledge_library(confidence DESC);
CREATE INDEX idx_knowledge_library_occurrence_count ON knowledge_library(occurrence_count DESC);
CREATE INDEX idx_knowledge_library_created_at ON knowledge_library(created_at DESC);

-- ============================================
-- Table: improvement_plans
-- Stores self-improvement plans and their execution status
-- ============================================
CREATE TYPE improvement_plan_status AS ENUM ('draft', 'active', 'in_progress', 'completed', 'paused', 'cancelled');

CREATE TABLE IF NOT EXISTS improvement_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    focus_area VARCHAR(255) NOT NULL,
    plan_text TEXT NOT NULL,
    status improvement_plan_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for improvement_plans
CREATE INDEX idx_improvement_plans_focus_area ON improvement_plans(focus_area);
CREATE INDEX idx_improvement_plans_status ON improvement_plans(status);
CREATE INDEX idx_improvement_plans_created_at ON improvement_plans(created_at DESC);

-- ============================================
-- Row Level Security (RLS) Policies
-- Enable RLS for all tables (can be configured based on auth requirements)
-- ============================================
ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_plans ENABLE ROW LEVEL SECURITY;

-- Default policies allowing all operations for authenticated users
-- Adjust these based on your specific security requirements
CREATE POLICY "Enable all operations for authenticated users" ON task_executions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON knowledge_library
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON improvement_plans
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Service role bypass policies (for backend operations)
CREATE POLICY "Service role bypass" ON task_executions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role bypass" ON knowledge_library
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role bypass" ON improvement_plans
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE task_executions IS 'Tracks all AI task executions with performance metrics and error logging';
COMMENT ON COLUMN task_executions.task_type IS 'Type/category of the task being executed';
COMMENT ON COLUMN task_executions.input IS 'JSON input parameters for the task';
COMMENT ON COLUMN task_executions.output IS 'JSON output/result from the task execution';
COMMENT ON COLUMN task_executions.success IS 'Whether the task completed successfully';
COMMENT ON COLUMN task_executions.error_log IS 'Error message and stack trace if task failed';
COMMENT ON COLUMN task_executions.duration_ms IS 'Execution time in milliseconds';

COMMENT ON TABLE knowledge_library IS 'Stores learned solutions and patterns for self-teaching capabilities';
COMMENT ON COLUMN knowledge_library.problem_family IS 'Category/family of problems this solution addresses';
COMMENT ON COLUMN knowledge_library.solution IS 'JSON representation of the solution/approach';
COMMENT ON COLUMN knowledge_library.source IS 'Origin of this knowledge (e.g., task execution ID, external source)';
COMMENT ON COLUMN knowledge_library.confidence IS 'Confidence score from 0 to 1 based on success rate';
COMMENT ON COLUMN knowledge_library.occurrence_count IS 'Number of times this solution has been applied';

COMMENT ON TABLE improvement_plans IS 'Self-improvement plans generated by the AI system';
COMMENT ON COLUMN improvement_plans.focus_area IS 'Area of improvement (e.g., accuracy, speed, specific task type)';
COMMENT ON COLUMN improvement_plans.plan_text IS 'Detailed improvement plan description';
COMMENT ON COLUMN improvement_plans.status IS 'Current status of the improvement plan';
