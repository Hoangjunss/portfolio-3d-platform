-- token_hash is the lookup key for every refresh and logout; UNIQUE additionally turns a hash
-- collision (or a double-issue bug) into a loud write failure instead of an ambiguous read.
CREATE UNIQUE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);

-- Supports the nightly purge in RefreshTokenCleanupJob.
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
