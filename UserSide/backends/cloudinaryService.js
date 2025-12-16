/**
 * Cloudinary Service
 * Handles file uploads to Cloudinary for persistent storage
 * Replaces local file storage which is lost on Render redeployments
 */

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Local file path to upload
 * @param {string} folder - Cloudinary folder (e.g., 'evidence', 'verifications')
 * @param {object} options - Additional upload options
 * @returns {Promise<{success: boolean, url?: string, public_id?: string, error?: string}>}
 */
const uploadFile = async (filePath, folder = 'alertdavao', options = {}) => {
    try {
        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            console.error('❌ Cloudinary not configured - missing CLOUDINARY_CLOUD_NAME');
            return { success: false, error: 'Cloudinary not configured' };
        }

        console.log(`☁️ Uploading to Cloudinary: ${filePath}`);
        console.log(`   Folder: ${folder}`);

        const result = await cloudinary.uploader.upload(filePath, {
            folder: `alertdavao/${folder}`,
            resource_type: 'auto', // Automatically detect image/video/raw
            ...options
        });

        console.log(`✅ Cloudinary upload successful!`);
        console.log(`   URL: ${result.secure_url}`);
        console.log(`   Public ID: ${result.public_id}`);

        // Delete local file after successful upload
        try {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Local file deleted: ${filePath}`);
        } catch (deleteError) {
            console.warn(`⚠️ Could not delete local file: ${deleteError.message}`);
        }

        return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            resource_type: result.resource_type,
            bytes: result.bytes
        };
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Upload a buffer directly to Cloudinary (for encrypted files)
 * @param {Buffer} buffer - File buffer to upload
 * @param {string} folder - Cloudinary folder
 * @param {string} filename - Original filename for reference
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
const uploadBuffer = async (buffer, folder = 'alertdavao', filename = 'file') => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            console.error('❌ Cloudinary not configured');
            return { success: false, error: 'Cloudinary not configured' };
        }

        console.log(`☁️ Uploading buffer to Cloudinary...`);

        return new Promise((resolve) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `alertdavao/${folder}`,
                    resource_type: 'auto',
                    public_id: filename.replace(/\.[^.]+$/, '') // Remove extension
                },
                (error, result) => {
                    if (error) {
                        console.error('❌ Cloudinary upload error:', error);
                        resolve({ success: false, error: error.message });
                    } else {
                        console.log(`✅ Buffer upload successful: ${result.secure_url}`);
                        resolve({
                            success: true,
                            url: result.secure_url,
                            public_id: result.public_id
                        });
                    }
                }
            );

            // Write buffer to stream
            const { Readable } = require('stream');
            const readableStream = new Readable();
            readableStream.push(buffer);
            readableStream.push(null);
            readableStream.pipe(uploadStream);
        });
    } catch (error) {
        console.error('❌ Cloudinary buffer upload error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const deleteFile = async (publicId) => {
    try {
        console.log(`🗑️ Deleting from Cloudinary: ${publicId}`);

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            console.log(`✅ Deleted successfully`);
            return { success: true };
        } else {
            console.warn(`⚠️ Delete result: ${result.result}`);
            return { success: false, error: result.result };
        }
    } catch (error) {
        console.error('❌ Cloudinary delete error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get a signed URL for private files (with optional transformations)
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Transformation options
 * @returns {string} Signed URL
 */
const getSignedUrl = (publicId, options = {}) => {
    return cloudinary.url(publicId, {
        sign_url: true,
        secure: true,
        ...options
    });
};

/**
 * Check if Cloudinary is properly configured
 * @returns {boolean}
 */
const isConfigured = () => {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

module.exports = {
    uploadFile,
    uploadBuffer,
    deleteFile,
    getSignedUrl,
    isConfigured,
    cloudinary // Export raw cloudinary for advanced usage
};
