import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Function to sanitize strings
function sanitizeString(input: string): string {
  return input.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
}

const prisma = new PrismaClient();

async function seedUsers() {
  try {


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
        name: 'Girish',
        email: 'girish@bhavyaentrprises.com',
        password: 'admin@123',
        role: 'ADMIN', // Ensure this is a valid enum value
        mobile: '9999971362',
      },
      {
        name: 'Shashank',
        email: 'shashank.sharma@praarabdh.com',
        password: 'admin@123',
        role: 'ADMIN', // Ensure this is a valid enum value
        mobile: '9999971363',
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
