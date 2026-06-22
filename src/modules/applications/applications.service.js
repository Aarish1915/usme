// src/services/applications.service.js
const prisma = require('../../common/database/prismaClient');
const crypto = require('crypto');

/**
 * Create a new draft application for the authenticated user.
 * Returns the created Applications row.
 */
async function createDraft(userId) {
    let app = await prisma.applications.findUnique({ where: { user_id: userId } });
    if (!app) {
        app = await prisma.applications.create({
            data: {
                user_id: userId,
                draft_data: {},
                current_step: 1,
                status: 'draft'
            }
        });
    }
    return app;
}

/**
 * Get draft by registrationId (public id on Users) and ensure ownership.
 * Returns Applications row or null if not found / not owner.
 */
async function getDraftByRegistrationId(registrationId, userId) {
    const user = await prisma.users.findUnique({ where: { registration_id: registrationId } });
    if (!user || user.id !== userId) return null;
    const app = await prisma.applications.findUnique({ where: { user_id: user.id } });
    return app;
}

/**
 * Save a step: validate externally (pass a Zod schema), merge into draft_data,
 * and perform optimistic update using updated_at to avoid lost writes.
 *
 * stepSchema must be a Zod schema object with .parse()
 */
async function saveStep(registrationId, userId, stepNumber, payload, stepSchema) {
    const user = await prisma.users.findUnique({ where: { registration_id: registrationId } });
    if (!user || user.id !== userId) throw { status: 403, message: 'Not owner' };

    let app = await prisma.applications.findUnique({ where: { user_id: user.id } });
    if (!app) {
        // Auto-create draft if it doesn't exist
        app = await prisma.applications.create({
            data: {
                user_id: user.id,
                draft_data: {},
                current_step: 1,
                status: 'draft'
            }
        });
    }

    // Validate only fields present in payload
    const parsed = stepSchema.parse(payload);

    // Merge draft_data in JS (client partials overwrite same keys)
    const merged = { ...(app.draft_data || {}), ...parsed };

    // Optimistic update using version check
    const updated = await prisma.applications.updateMany({
        where: { id: app.id, version: app.version },
        data: {
            draft_data: merged,
            current_step: stepNumber,
            version: { increment: 1 }
        }
    });

    if (updated.count === 0) throw { status: 409, message: 'CONCURRENT_MODIFICATION: This application was modified by another session. Please refresh and try again.' };
    return { ok: true };
}

/**
 * Submit application: fullSchema is a Zod schema for the entire form.
 * computeNonMinorityPct is a function that returns percentage (0-100).
 */
async function submitApplication(registrationId, userId, fullSchema, computeNonMinorityPct) {
    const user = await prisma.users.findUnique({ where: { registration_id: registrationId } });
    if (!user || user.id !== userId) throw { status: 403 };

    const app = await prisma.applications.findUnique({ where: { user_id: user.id } });
    if (!app) throw { status: 404 };

    // Full validation
    const validated = fullSchema.parse(app.draft_data);

    // Strict file upload checks
    const reqDocs = [
        { key: 'q5_upload', name: 'Recognition Letter' },
        { key: 'q10_upload', name: 'Land Documents' },
        { key: 'q11_upload', name: 'Bank Passbook' },
        { key: 'q14_upload', name: 'Affidavit (Non-Coercion)' },
        { key: 'q16_upload', name: 'Affidavit (Communal Harmony)' },
        { key: 'q17_upload', name: 'Affidavit (TMA Pai)' }
    ];
    for (const d of reqDocs) {
        if (!validated[d.key]) throw { status: 422, message: `Missing required document: ${d.name}` };
    }
    
    if (validated.q7_society && !validated.q7_upload) {
        throw { status: 422, message: 'Society Registration document is missing.' };
    }
    if (validated.q8_gst && !validated.q8_upload) {
        throw { status: 422, message: 'GST Certificate is missing.' };
    }

    // Statutory check: Section 14 enrollment cap
    const nonMinorityPct = computeNonMinorityPct(validated.q19_classes || []);
    let appStatus = 'submitted';
    
    if (nonMinorityPct > 15) {
        if (!validated.justification_upload) {
            throw { status: 422, message: `Non-minority enrollment (${nonMinorityPct.toFixed(1)}%) exceeds 15%. Please upload a Justification Document.` };
        }
        appStatus = 'submitted_override_pending';
    }

    // Atomic transaction: update application status and write to normalized tables
    await prisma.$transaction(async (tx) => {
        const updateRes = await tx.applications.updateMany({
            where: { id: app.id, version: app.version },
            data: {
                status: appStatus,
                institution_name: validated.q1_name || null,
                established_year: validated.q3_year || null,
                submitted_at: new Date(),
                version: { increment: 1 }
            }
        });
        
        if (updateRes.count === 0) throw { status: 409, message: 'CONCURRENT_MODIFICATION: Application modified by another session.' };

        // Normalize Management Committee (Format I)
        if (validated.q9_members && validated.q9_members.length > 0) {
            await tx.managementCommittee.createMany({
                data: validated.q9_members.map(m => ({
                    application_id: app.id,
                    member_name: m.name,
                    father_name: m.fname || null,
                    dob: m.dob || null,
                    designation: m.designation || null,
                    address: m.address || null,
                    phone: m.phone || null,
                    qualification: m.qualification || null,
                    experience: m.experience || null
                }))
            });
        }

        // Normalize Staff Roster (Format II)
        if (validated.q15_staff && validated.q15_staff.length > 0) {
            await tx.staffRoster.createMany({
                data: validated.q15_staff.map(s => ({
                    application_id: app.id,
                    name: s.name,
                    designation: s.designation || null,
                    address: s.address || null,
                    profession: s.profession || null
                }))
            });
        }

        // Normalize Student Demographics (Format III)
        if (validated.q19_classes && validated.q19_classes.length > 0) {
            await tx.studentDemographics.createMany({
                data: validated.q19_classes.map(c => ({
                    application_id: app.id,
                    class_level: c.className || '',
                    minority_boys: parseInt(c.minority_boys) || 0,
                    minority_girls: parseInt(c.minority_girls) || 0,
                    minority_total: parseInt(c.minority_total) || 0,
                    others_boys: parseInt(c.others_boys) || 0,
                    others_girls: parseInt(c.others_girls) || 0,
                    others_total: parseInt(c.others_total) || 0,
                    grand_total: parseInt(c.grand_total) || 0
                }))
            });
        }

        // Normalize Documents
        const docsToInsert = [];
        const docMapping = {
            q5_upload: 'RECOGNITION_LETTER',
            q7_upload: 'SOCIETY_REGISTRATION',
            q8_upload: 'GST_CERTIFICATE',
            q10_upload: 'LAND_DOCUMENTS',
            q11_upload: 'BANK_PASSBOOK',
            q14_upload: 'AFFIDAVIT_NON_COERCION',
            q16_upload: 'AFFIDAVIT_COMMUNAL_HARMONY',
            q17_upload: 'AFFIDAVIT_TMA_PAI',
            justification_upload: 'JUSTIFICATION_DOCUMENT'
        };

        for (const [key, docType] of Object.entries(docMapping)) {
            if (validated[key]) {
                docsToInsert.push({
                    application_id: app.id,
                    document_type: docType,
                    s3_key: validated[key]
                });
            }
        }

        if (docsToInsert.length > 0) {
            await tx.documents.createMany({ data: docsToInsert, skipDuplicates: true });
        }
    });

    // PDF generation is now handled synchronously when requested.

    return { ok: true, status: appStatus };
}

module.exports = {
    createDraft,
    getDraftByRegistrationId,
    saveStep,
    submitApplication
};
