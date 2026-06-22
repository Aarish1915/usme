// PDF helpers
module.exports = {};
// src/utils/pdfQueue.js
const Queue = require('bull');
const { redisUrl } = require('../config');
const pdfQueue = new Queue('pdf', redisUrl || 'redis://127.0.0.1:6379');
module.exports = pdfQueue;
