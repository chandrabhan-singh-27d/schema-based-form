-- Core forms table
CREATE TABLE IF NOT EXISTS forms (
    id BIGSERIAL PRIMARY KEY,
    schema_id VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    success_message TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Each field for a form schema
CREATE TABLE IF NOT EXISTS form_fields (
    id BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    field_id VARCHAR(120) NOT NULL,
    field_type VARCHAR(30) NOT NULL,
    label VARCHAR(255) NOT NULL,
    placeholder TEXT,
    description TEXT,
    class_name VARCHAR(255),
    default_value JSONB,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    min_value NUMERIC,
    max_value NUMERIC,
    min_length INT,
    max_length INT,
    pattern TEXT,
    custom_validator VARCHAR(120),
    validation_message TEXT,
    sort_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (form_id, field_id)
);

-- Options for select/radio fields
CREATE TABLE IF NOT EXISTS field_options (
    id BIGSERIAL PRIMARY KEY,
    field_ref_id BIGINT NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    option_label VARCHAR(255) NOT NULL,
    option_value TEXT NOT NULL,
    sort_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conditional visibility/validation rules for a field
CREATE TABLE IF NOT EXISTS field_conditions (
    id BIGSERIAL PRIMARY KEY,
    field_ref_id BIGINT NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    target_field_id VARCHAR(120) NOT NULL,
    operator VARCHAR(20) NOT NULL,
    expected_value JSONB NOT NULL,
    condition_group VARCHAR(20) NOT NULL DEFAULT 'all',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One submission event
CREATE TABLE IF NOT EXISTS form_submissions (
    id BIGSERIAL PRIMARY KEY,
    form_id BIGINT REFERENCES forms(id) ON DELETE RESTRICT,
    schema_id VARCHAR(120) NOT NULL,
    schema_title VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitter_id VARCHAR(120),
    submitter_ip INET,
    user_agent TEXT
);

-- One answer per submitted field
CREATE TABLE IF NOT EXISTS submission_answers (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    field_ref_id BIGINT REFERENCES form_fields(id) ON DELETE SET NULL,
    field_id VARCHAR(120) NOT NULL,
    value_text TEXT,
    value_number NUMERIC,
    value_boolean BOOLEAN,
    value_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_field_options_field_ref_id ON field_options(field_ref_id);
CREATE INDEX IF NOT EXISTS idx_field_conditions_field_ref_id ON field_conditions(field_ref_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_schema_id ON form_submissions(schema_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_submission_answers_submission_id ON submission_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_answers_field_id ON submission_answers(field_id);
