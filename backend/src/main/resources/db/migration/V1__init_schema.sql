CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE media (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL,
    uploaded_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    subdomain VARCHAR(128) NOT NULL UNIQUE,
    thumbnail_media_id BIGINT REFERENCES media(id),
    description TEXT,
    category VARCHAR(128),
    tech_tags VARCHAR(512),
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    view_count BIGINT NOT NULL DEFAULT 0,
    click_count BIGINT NOT NULL DEFAULT 0,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP
);

CREATE TABLE content_sections (
    id BIGSERIAL PRIMARY KEY,
    section_key VARCHAR(64) NOT NULL UNIQUE,
    data_json JSONB NOT NULL,
    version INT NOT NULL DEFAULT 1,
    updated_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE leads (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    message TEXT,
    source_template_id BIGINT REFERENCES templates(id),
    status VARCHAR(16) NOT NULL DEFAULT 'NEW',
    internal_note TEXT,
    assigned_to BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(32) NOT NULL,
    template_id BIGINT REFERENCES templates(id),
    session_id VARCHAR(128) NOT NULL,
    ip_hash VARCHAR(128) NOT NULL,
    user_agent VARCHAR(512),
    referrer VARCHAR(1024),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(16) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id BIGINT,
    old_value_json JSONB,
    new_value_json JSONB,
    ip_address VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE system_error_logs (
    id BIGSERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    http_status INT NOT NULL,
    exception_class VARCHAR(255) NOT NULL,
    message TEXT,
    stacktrace TEXT,
    request_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(128) NOT NULL UNIQUE,
    value_json JSONB NOT NULL,
    updated_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_template_created ON analytics_events(template_id, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_leads_status ON leads(status);
