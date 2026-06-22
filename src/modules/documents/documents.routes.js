const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('./documents.controller');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../Public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer to keep the file in RAM so we can stream it to S3
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// We won't strictly require `auth` middleware for the upload endpoint just to keep the frontend simple for now, 
// but in production it should be added.
router.post('/upload', upload.single('file'), ctrl.uploadFile);

module.exports = router;
