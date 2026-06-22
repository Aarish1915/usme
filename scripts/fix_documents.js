const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDocs() {
    const apps = await prisma.applications.findMany({
        where: { status: { not: 'draft' } },
        include: { documents: true }
    });

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

    let count = 0;
    for (const app of apps) {
        if (app.documents.length === 0 && app.draft_data) {
            const data = typeof app.draft_data === 'string' ? JSON.parse(app.draft_data) : app.draft_data;
            const docsToInsert = [];
            for (const [key, docType] of Object.entries(docMapping)) {
                if (data[key]) {
                    docsToInsert.push({
                        application_id: app.id,
                        document_type: docType,
                        s3_key: data[key]
                    });
                }
            }
            if (docsToInsert.length > 0) {
                await prisma.documents.createMany({ data: docsToInsert, skipDuplicates: true });
                count += docsToInsert.length;
            }
        }
    }
    console.log(`Successfully migrated ${count} documents for existing applications!`);
}
fixDocs().then(() => process.exit(0));
