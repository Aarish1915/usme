const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');
const authMiddleware = require('../../common/middlewares/auth.middleware');
const { requireRole } = require('../../common/middlewares/rbac.middleware');

router.use(authMiddleware);
router.use(requireRole(['admin', 'admin_reviewer', 'admin_decision']));

router.get('/applications', reviewController.listApplications);
router.get('/applications/:id', reviewController.getApplicationDetail);
router.get('/applications/:id/pdf', reviewController.getApplicationPdf);
router.post('/applications/:id/decision', reviewController.makeDecision);

module.exports = router;
