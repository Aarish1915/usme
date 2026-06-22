const svc = require('./applications.service');
const { schemas, fullSchema } = require('./application.schemas');
const { generateApplicationPDF } = require('../../common/utils/pdf.service');

// Helper to compute percentage for statutory check (Sec 14)
function computeNonMinorityPct(classesData) {
    if (!classesData || classesData.length === 0) return 0;
    let totalMinority = 0;
    let totalOthers = 0;
    
    classesData.forEach(c => {
        totalMinority += Number(c.minority) || 0;
        totalOthers += Number(c.others) || 0;
    });
    
    const grandTotal = totalMinority + totalOthers;
    if (grandTotal === 0) return 0;
    return (totalOthers / grandTotal) * 100;
}

async function createDraft(req, res, next) {
    try {
        const app = await svc.createDraft(req.user.id);
        return res.status(201).json({ applicationId: app.id, registrationId: req.user.registration_id });
    } catch (err) { next(err); }
}

async function getDraft(req, res, next) {
    try {
        const { registrationId } = req.params;
        const app = await svc.getDraftByRegistrationId(registrationId, req.user.id);
        if (!app) return res.status(404).json({ error: 'Not found' });
        return res.json(app);
    } catch (err) { next(err); }
}

async function saveStep(req, res, next) {
    try {
        const { registrationId, stepNumber } = req.params;
        const num = Number(stepNumber);
        
        const schema = schemas[num];
        if (!schema) return res.status(400).json({ error: 'Invalid step number' });

        await svc.saveStep(registrationId, req.user.id, num, req.body, schema);
        return res.json({ ok: true });
    } catch (err) { 
        if (err.errors) {
            // Zod validation error
            return res.status(400).json({ error: 'Validation Failed', details: err.errors });
        }
        next(err); 
    }
}

async function validateDraft(req, res, next) {
    try {
        const { registrationId } = req.params;
        // Just run the same checks as submitApplication but don't change DB status
        const app = await svc.getDraftByRegistrationId(registrationId, req.user.id);
        if (!app) return res.status(404).json({ error: 'Not found' });

        const validated = fullSchema.parse(app.draft_data);

        // Statutory check
        const nonMinorityPct = computeNonMinorityPct(validated.q19_classes || []);
        if (nonMinorityPct > 15) {
            return res.status(422).json({ error: `Non-minority enrollment (${nonMinorityPct.toFixed(1)}%) exceeds the 15% limit.` });
        }

        if (!validated.q14_upload || !validated.q16_upload || !validated.q17_upload) {
            return res.status(422).json({ error: 'All 3 Affidavits must be uploaded before final submission.' });
        }

        return res.json({ ok: true });
    } catch (err) {
        if (err.errors) {
            return res.status(400).json({ error: 'Please complete all mandatory fields across all steps before submitting.', details: err.errors });
        }
        next(err);
    }
}

async function submit(req, res, next) {
    try {
        const { registrationId } = req.params;
        await svc.submitApplication(registrationId, req.user.id, fullSchema, computeNonMinorityPct);
        return res.json({ ok: true });
    } catch (err) { 
        if (err.errors) {
            return res.status(400).json({ error: 'Please complete all mandatory fields across all steps before submitting.', details: err.errors });
        }
        if (err.status && err.message) {
            return res.status(err.status).json({ error: err.message });
        }
        next(err); 
    }
}

async function downloadPdf(req, res, next) {
    try {
        const { registrationId } = req.params;
        const app = await svc.getDraftByRegistrationId(registrationId, req.user.id);
        if (!app) return res.status(404).json({ error: 'Not found' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=USAME_Application_${registrationId}.pdf`);
        
        generateApplicationPDF(app.draft_data || {}, res);
    } catch (err) { next(err); }
}

module.exports = { createDraft, getDraft, saveStep, validateDraft, submit, downloadPdf };
