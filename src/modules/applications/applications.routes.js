// src/routes/applications.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../../common/middlewares/auth.middleware'); // must set req.user.id and req.user.registration_id
const ctrl = require('./applications.controller');

router.post('/', auth, ctrl.createDraft);
router.get('/:registrationId', auth, ctrl.getDraft);
router.get('/:registrationId/pdf', auth, ctrl.downloadPdf);
router.patch('/:registrationId/step/:stepNumber', auth, ctrl.saveStep);
router.post('/:registrationId/validate', auth, ctrl.validateDraft);
router.post('/:registrationId/submit', auth, ctrl.submit);

module.exports = router;
