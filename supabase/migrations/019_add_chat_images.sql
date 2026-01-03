-- Add image_urls column to chat_messages table
-- This allows storing multiple image URLs per message for vision analysis

-- Add image_urls JSONB column to store array of image URLs
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Add index for efficient queries on image_urls
CREATE INDEX IF NOT EXISTS idx_chat_messages_image_urls 
ON chat_messages USING GIN (image_urls);

-- Add comment for documentation
COMMENT ON COLUMN chat_messages.image_urls IS 'Array of image URLs associated with this message, stored as JSONB array: ["url1", "url2", ...]';

