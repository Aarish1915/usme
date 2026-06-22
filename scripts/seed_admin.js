const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seedAdmin() {
    try {
        const password_hash = await bcrypt.hash('admin123', 10);
        const adminUser = await prisma.users.upsert({
            where: { mobile: '0000000000' },
            update: {
                role: 'admin'
            },
            create: {
                mobile: '0000000000',
                email: 'admin@usame.gov.in',
                name: 'USAME Super Admin',
                password_hash,
                role: 'admin' // Full access
            }
        });
        
        console.log('✅ Admin user created/updated successfully!');
        console.log('Mobile: 0000000000');
        console.log('Password: admin123');
        console.log('Role: admin');
    } catch (err) {
        console.error('Error seeding admin:', err);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
