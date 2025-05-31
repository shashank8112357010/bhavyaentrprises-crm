import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Function to sanitize strings
function sanitizeString(input: string): string {
  return input.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
}

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    // Seed an admin user
    const hashedAdminPassword = await bcrypt.hash('admin@123', 10);
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: sanitizeString('Admin'),
        email: sanitizeString('admin@example.com'),
        password: hashedAdminPassword,
        role: 'ADMIN', // Ensure this is a valid enum value
        mobile: sanitizeString('1234567890'),
      },
    });

    console.log('✅ Admin user seeded');

    // Seed regular users
    const users = [
      {
        name: 'Karishma Verma',
        email: 'helpdesk@bhavyaentrprises.com',
        password: 'welcome@crm',
        role: 'BACKEND', // Ensure this is a valid enum value
        mobile: '9988818489',
      },
      {
        name: 'Pankaj Dagolia',
        email: 'helpdesk2@bhavyaentrprises.com',
        password: 'welcome@crm',
        role: 'BACKEND', // Ensure this is a valid enum value
        mobile: '8288861189',
      },
      {
        name: 'Umesh Dhaka',
        email: 'helpdesk3@bhavyaentrprises.com',
        password: 'welcome@crm',
        role: 'BACKEND', // Ensure this is a valid enum value
        mobile: '7696411189',
      },
      {
        name: 'Aarti Mehra',
        email: 'account@bhavya.com',
        password: 'welcome@crm',
        role: 'ACCOUNTS', // Ensure this is a valid enum value
        mobile: '7696511189',
      },
      {
        name: 'Anurag Yadav',
        email: 'account2@bhavya.com',
        password: 'welcome@crm',
        role: 'ACCOUNTS', // Ensure this is a valid enum value
        mobile: '8699511189',
      },
      {
        name: 'Shashank Sharma',
        email: 'helpdesk4@bhavyaentrprises.com',
        password: 'welcome@crm',
        role: 'BACKEND', // Ensure this is a valid enum value
        mobile: '9026849414',
      }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          name: sanitizeString(user.name),
          email: sanitizeString(user.email),
          password: hashedPassword,
          role: user.role as any, // Cast to any to bypass type checking, ensure it matches the enum
          mobile: sanitizeString(user.mobile),
        },
      });
    }

    console.log('✅ Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
