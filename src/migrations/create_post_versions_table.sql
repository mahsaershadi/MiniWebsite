-- Create post_versions table for data versioning
CREATE TABLE IF NOT EXISTS post_versions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  cover_photo_id INTEGER REFERENCES photos(id),
  status INTEGER NOT NULL DEFAULT 1,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  attributes JSONB NOT NULL DEFAULT '{}',
  changed_by INTEGER NOT NULL REFERENCES users(id),
  change_type VARCHAR(10) NOT NULL CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE')),
  change_reason VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique version numbers per post
  UNIQUE(post_id, version_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_versions_post_id ON post_versions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_versions_changed_by ON post_versions(changed_by);
CREATE INDEX IF NOT EXISTS idx_post_versions_created_at ON post_versions(created_at);
