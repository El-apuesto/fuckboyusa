// ============================================
// VIDEO PROFILE FUNCTIONS
// ============================================

/**
 * Upload video clip to Supabase Storage
 * @param {Blob} videoBlob - The recorded video blob
 * @param {string} userId - User's ID
 * @param {number} clipNumber - Clip number (1-5)
 * @returns {Promise<object>} Upload result with URL
 */
async function uploadVideoClip(videoBlob, userId, clipNumber) {
    try {
        const timestamp = Date.now();
        const fileName = `${userId}/clips/clip-${clipNumber}-${timestamp}.webm`;
        
        const { data, error } = await supabase.storage
            .from('video-profiles')
            .upload(fileName, videoBlob, {
                contentType: 'video/webm',
                upsert: false
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('video-profiles')
            .getPublicUrl(fileName);
        
        return { success: true, url: publicUrl, path: fileName };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Save all clips metadata to database
 * @param {string} userId - User's ID
 * @param {Array} clipUrls - Array of clip URLs
 * @returns {Promise<object>} Save result
 */
async function saveVideoClipsMetadata(userId, clipUrls) {
    try {
        const { data, error } = await supabase
            .from('video_clips')
            .insert({
                user_id: userId,
                clip_urls: clipUrls,
                status: 'processing',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Save metadata error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update processed video URL
 * @param {string} userId - User's ID
 * @param {string} processedVideoUrl - Final edited video URL
 * @returns {Promise<object>} Update result
 */
async function updateProcessedVideo(userId, processedVideoUrl) {
    try {
        // Update user profile with video URL
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                video_profile_url: processedVideoUrl,
                has_video_profile: true
            })
            .eq('id', userId);
        
        if (profileError) throw profileError;
        
        // Update video clips status
        const { error: clipsError } = await supabase
            .from('video_clips')
            .update({
                status: 'completed',
                processed_url: processedVideoUrl
            })
            .eq('user_id', userId);
        
        if (clipsError) throw clipsError;
        
        return { success: true };
    } catch (error) {
        console.error('Update processed video error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user's video profile
 * @param {string} userId - User's ID
 * @returns {Promise<object>} Video profile data
 */
async function getUserVideoProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('video_profile_url, has_video_profile')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Get video profile error:', error);
        return null;
    }
}

/**
 * Process video with AI (placeholder for AI editing API)
 * This would call an external API like:
 * - RunwayML for AI video editing
 * - Shotstack for automated video editing
 * - Custom FFmpeg server
 * @param {Array} clipUrls - Array of clip URLs
 * @returns {Promise<object>} Processed video URL
 */
async function processVideoWithAI(clipUrls) {
    try {
        // PLACEHOLDER: This would call your AI video editing API
        // For now, we'll just return a mock response
        
        console.log('Processing clips with AI:', clipUrls);
        
        // Example API call structure:
        /*
        const response = await fetch('YOUR_AI_API_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_API_KEY'
            },
            body: JSON.stringify({
                clips: clipUrls,
                style: 'confident', // user-selected style
                transitions: 'smooth',
                music: 'upbeat',
                duration: 30
            })
        });
        
        const result = await response.json();
        return { success: true, videoUrl: result.output_url };
        */
        
        // Mock response for now
        return { 
            success: true, 
            videoUrl: 'https://example.com/processed-video.mp4',
            message: 'AI processing would happen here'
        };
    } catch (error) {
        console.error('AI processing error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Complete workflow: Upload clips, process with AI, save to profile
 * @param {Array} videoBlobs - Array of recorded video blobs
 * @param {string} userId - User's ID
 * @param {string} style - Video style preference
 * @returns {Promise<object>} Complete result
 */
async function completeVideoProfileWorkflow(videoBlobs, userId, style = 'confident') {
    try {
        // Step 1: Upload all clips
        const uploadPromises = videoBlobs.map((blob, index) => 
            uploadVideoClip(blob, userId, index + 1)
        );
        
        const uploadResults = await Promise.all(uploadPromises);
        const clipUrls = uploadResults
            .filter(result => result.success)
            .map(result => result.url);
        
        if (clipUrls.length !== videoBlobs.length) {
            throw new Error('Some clips failed to upload');
        }
        
        // Step 2: Save clips metadata
        await saveVideoClipsMetadata(userId, clipUrls);
        
        // Step 3: Process with AI
        const aiResult = await processVideoWithAI(clipUrls);
        
        if (!aiResult.success) {
            throw new Error('AI processing failed');
        }
        
        // Step 4: Update profile with processed video
        await updateProcessedVideo(userId, aiResult.videoUrl);
        
        return { 
            success: true, 
            videoUrl: aiResult.videoUrl,
            message: 'Video profile created successfully!'
        };
    } catch (error) {
        console.error('Complete workflow error:', error);
        return { success: false, error: error.message };
    }
}

// Export functions
if (typeof window !== 'undefined') {
    window.videoFunctions = {
        uploadVideoClip,
        saveVideoClipsMetadata,
        updateProcessedVideo,
        getUserVideoProfile,
        processVideoWithAI,
        completeVideoProfileWorkflow
    };
}

console.log('Video functions loaded');
