-- ============================================
-- VIDEO PROFILES SETUP FOR SUPABASE
-- ============================================

-- Step 1: Create Storage Bucket for videos
-- Go to Supabase Dashboard > Storage > Create a new bucket
-- Name: video-profiles
-- Public: YES (so videos can be viewed)
-- Or run this SQL in Supabase:

INSERT INTO storage.buckets (id, name, public)
VALUES ('video-profiles', 'video-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Set storage policies for video-profiles bucket
CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'video-profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-profiles');

CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'video-profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 3: Add video fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS video_profile_url TEXT,
ADD COLUMN IF NOT EXISTS has_video_profile BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_style TEXT DEFAULT 'confident';

-- Step 4: Create video_clips table for tracking
CREATE TABLE IF NOT EXISTS video_clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    clip_urls TEXT[] NOT NULL,
    processed_url TEXT,
    status TEXT CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
    style TEXT DEFAULT 'confident',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Enable RLS on video_clips
ALTER TABLE video_clips ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies for video_clips
DROP POLICY IF EXISTS "Users can view their own video clips" ON video_clips;
CREATE POLICY "Users can view their own video clips" 
ON video_clips FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own video clips" ON video_clips;
CREATE POLICY "Users can insert their own video clips" 
ON video_clips FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own video clips" ON video_clips;
CREATE POLICY "Users can update their own video clips" 
ON video_clips FOR UPDATE 
USING (auth.uid() = user_id);

-- Step 6: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_clips_user_id ON video_clips(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_has_video ON profiles(has_video_profile) WHERE has_video_profile = true;

-- Step 7: Add video views tracking (optional)
CREATE TABLE IF NOT EXISTS video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    view_duration INTEGER, -- seconds watched
    completed BOOLEAN DEFAULT false
);

ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert video views" 
ON video_views FOR INSERT 
WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Video owners can see their views" 
ON video_views FOR SELECT 
USING (auth.uid() = video_owner_id);

CREATE INDEX IF NOT EXISTS idx_video_views_owner ON video_views(video_owner_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewer ON video_views(viewer_id);

-- ============================================
-- HELPFUL QUERIES
-- ============================================

-- Get users with video profiles
-- SELECT id, name, video_profile_url FROM profiles WHERE has_video_profile = true;

-- Get video processing status for a user
-- SELECT * FROM video_clips WHERE user_id = 'USER_ID_HERE' ORDER BY created_at DESC;

-- Count total video profiles
-- SELECT COUNT(*) FROM profiles WHERE has_video_profile = true;

-- Get most viewed video profiles
-- SELECT 
--     p.id, 
--     p.name, 
--     COUNT(vv.id) as view_count
-- FROM profiles p
-- LEFT JOIN video_views vv ON p.id = vv.video_owner_id
-- WHERE p.has_video_profile = true
-- GROUP BY p.id, p.name
-- ORDER BY view_count DESC
-- LIMIT 10;
