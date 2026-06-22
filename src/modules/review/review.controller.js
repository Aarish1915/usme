const prisma = require('../../common/database/prismaClient');

async function listApplications(req, res, next) {
    try {
        const apps = await prisma.applications.findMany({
            where: {
                status: {
                    in: ['submitted', 'submitted_override_pending', 'under_review', 'approved', 'rejected']
                }
            },
            include: { user: true },
            orderBy: { submitted_at: 'desc' }
        });
        res.json({ ok: true, data: apps });
    } catch (err) {
        next(err);
    }
}

async function getApplicationDetail(req, res, next) {
    try {
        const { presignGet } = require('../../common/utils/s3');
        
        const app = await prisma.applications.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                documents: true,
                management_committee: true,
                staff_roster: true,
                student_demographics: true
            }
        });

        if (!app) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Generate Pre-Signed URLs for the Admin to securely view the private documents
        const secureDocuments = await Promise.all(app.documents.map(async (doc) => {
            const tempUrl = await presignGet(doc.s3_key, 300); // Expires in 5 minutes
            return {
                id: doc.id,
                document_type: doc.document_type,
                secure_url: tempUrl,
                uploaded_at: doc.uploaded_at
            };
        }));

        res.json({ 
            success: true, 
            data: {
                ...app,
                documents: secureDocuments // Swap out the raw keys with the secure links
            }
        });
    } catch (err) {
        next(err);
    }
}

async function makeDecision(req, res, next) {
    try {
        const { status, remarks } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid decision status' });
        }
        if (!remarks) {
            return res.status(400).json({ error: 'Remarks are mandatory for decisions' });
        }

        const app = await prisma.applications.findUnique({ 
            where: { id: req.params.id },
            include: { user: true }
        });
        if (!app) return res.status(404).json({ error: 'Not found' });

        await prisma.$transaction(async (tx) => {
            await tx.applications.update({
                where: { id: app.id },
                data: { status }
            });

            await tx.auditLogs.create({
                data: {
                    registration_id: app.user.registration_id || app.user_id,
                    actor_id: req.user.id,
                    actor_role: req.user.role,
                    action: `DECISION_${status.toUpperCase()}`,
                    previous_status: app.status,
                    new_status: status,
                    remarks: remarks
                }
            });
        });

        // Send SMS Notification
        const { sendSms } = require('../../common/utils/twilio');
        const applicantMobile = app.user.mobile;
        
        let smsMessage = '';
        if (status === 'approved') {
            smsMessage = `Dear Applicant, your USAME application (ID: ${app.user.registration_id}) has been APPROVED.`;
        } else if (status === 'rejected') {
            smsMessage = `Dear Applicant, your USAME application (ID: ${app.user.registration_id}) was REJECTED. Reason: ${remarks}`;
        }
        
        if (smsMessage) {
            try {
                await sendSms(applicantMobile, smsMessage);
            } catch (smsErr) {
                console.error('Failed to send SMS to applicant', smsErr);
            }
        }

        res.json({ ok: true, message: `Application ${status} successfully.` });
    } catch (err) {
        next(err);
    }
}

async function getApplicationPdf(req, res, next) {
    try {
        const app = await prisma.applications.findUnique({
            where: { id: req.params.id },
            include: { user: true }
        });
        if (!app) return res.status(404).json({ error: 'Not found' });

        // Generate PDF on the fly using the existing logic in pdf.service.js
        const { generateApplicationPDF } = require('../../common/utils/pdf.service');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="application_${app.user.registration_id}.pdf"`);
        
        // generateApplicationPDF pipes directly to the response
        generateApplicationPDF(app.draft_data, res);
    } catch (err) {
        next(err);
    }
}

module.exports = { listApplications, getApplicationDetail, makeDecision, getApplicationPdf };
