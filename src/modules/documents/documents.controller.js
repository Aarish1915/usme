// src/controllers/documents.controller.js
const { s3 } = require('../../common/utils/s3');
const { s3Bucket } = require('../../common/config');
const path = require('path');

async function uploadFile(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const s3Key = uniqueSuffix + path.extname(req.file.originalname);
        
        const params = {
            Bucket: s3Bucket,
            Key: s3Key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };

        // Upload buffer directly to Supabase S3
        await s3.upload(params).promise();

        return res.json({ success: true, url: s3Key });
    } catch (error) {
        console.error('S3 Upload Error:', error);
        return res.status(500).json({ error: 'Failed to securely upload document.' });
    }
}

module.exports = { uploadFile };
