ALTER TABLE events ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE events
SET images = jsonb_build_array(image_url)
WHERE images = '[]'::jsonb
   OR images IS NULL
   OR jsonb_array_length(images) = 0;
