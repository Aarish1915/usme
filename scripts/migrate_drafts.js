// scripts/migrate_drafts.js
const prisma = require('../src/db/prismaClient');

async function migrate() {
    console.log("Starting draft migration...");
    const drafts = await prisma.applications.findMany();
    let updated = 0;

    for (const app of drafts) {
        if (!app.draft_data) continue;
        let data = { ...app.draft_data };
        let modified = false;

        // Migrate Form I: Management Committee (add Experience)
        if (data.q9_members && Array.isArray(data.q9_members)) {
            data.q9_members = data.q9_members.map(m => {
                if (m.experience === undefined) {
                    m.experience = 'Not provided';
                    modified = true;
                }
                return m;
            });
        }

        // Migrate Form III: Classes (split into Boys/Girls)
        if (data.q19_classes && Array.isArray(data.q19_classes)) {
            data.q19_classes = data.q19_classes.map(c => {
                if (c.minority_total === undefined) {
                    // Try to migrate old single numbers into totals
                    const min_total = parseInt(c.minority) || 0;
                    const oth_total = parseInt(c.others) || 0;
                    c.minority_boys = '0';
                    c.minority_girls = min_total.toString();
                    c.minority_total = min_total.toString();
                    c.others_boys = '0';
                    c.others_girls = oth_total.toString();
                    c.others_total = oth_total.toString();
                    c.grand_total = (min_total + oth_total).toString();
                    modified = true;
                }
                return c;
            });
        }

        if (modified) {
            await prisma.applications.update({
                where: { id: app.id },
                data: { draft_data: data }
            });
            updated++;
        }
    }

    console.log(`Migration complete. Updated ${updated} drafts.`);
}

migrate()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
