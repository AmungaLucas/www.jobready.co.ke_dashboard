const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Check if admin user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@jobready.co.ke' },
    });
    
    if (existing) {
      console.log('Admin user already exists. Updating password...');
      const passwordHash = await bcrypt.hash('030290@Amunga@100%', 12);
      await prisma.user.update({
        where: { email: 'admin@jobready.co.ke' },
        data: {
          passwordHash,
          role: 'ADMIN',
          name: 'Admin',
          emailVerified: true,
        },
      });
      console.log('Admin user password updated successfully!');
    } else {
      const passwordHash = await bcrypt.hash('030290@Amunga@100%', 12);
      const admin = await prisma.user.create({
        data: {
          email: 'admin@jobready.co.ke',
          passwordHash,
          role: 'ADMIN',
          name: 'Admin',
          emailVerified: true,
          phoneVerified: true,
        },
      });
      console.log('Admin user created successfully!');
      console.log('ID:', admin.id);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
