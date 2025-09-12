-- Add status column to pages table if it doesn't exist
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'draft';

-- Verify it was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'pages';