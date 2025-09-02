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
        email: 'shashank@bhavyaentrprises.com',
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

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedClients() {
  try {
    const clients = [
      {
        name: 'ABC Corporation',
        type: 'Corporate',
        totalBranches: 3,
        contactPerson: 'Mike Johnson',
        contactEmail: 'mike@abccorp.com',
        contactPhone: '1234567890',
        contractStatus: 'ACTIVE',
        lastServiceDate: new Date(),
        gstn: 'GSTN123456',
        initials: 'ABC',
      },
      {
        name: 'XYZ Industries',
        type: 'Manufacturing',
        totalBranches: 2,
        contactPerson: 'Sarah Wilson',
        contactEmail: 'sarah@xyzind.com',
        contactPhone: '9876543210',
        contractStatus: 'ACTIVE',
        lastServiceDate: new Date(),
        gstn: 'GSTN789012',
        initials: 'XYZ',
      },
    ];

    for (const client of clients) {
      // Check if client already exists by name
      const existingClient = await prisma.client.findFirst({
        where: { name: client.name }
      });

      if (!existingClient) {
        await prisma.client.create({
          data: {
            ...client,
            name: sanitizeString(client.name),
            contactPerson: sanitizeString(client.contactPerson),
            contactEmail: sanitizeString(client.contactEmail),
            contactPhone: sanitizeString(client.contactPhone),
            gstn: sanitizeString(client.gstn),
            initials: sanitizeString(client.initials),
          }
        });
      }
    }
  } catch (error) {
    console.error('Error seeding clients:', error);
  }
}

async function seedRateCards() {
  try {
    const rateCards = [
      {
        srNo: 1,
        description: 'Basic Maintenance',
        unit: 'Per Visit',
        rate: 1000,
        bankName: 'HDFC',
      },
      {
        srNo: 2,
        description: 'Advanced Repair',
        unit: 'Per Hour',
        rate: 2500,
        bankName: 'ICICI',
      },
    ];

    for (const rateCard of rateCards) {
      await prisma.rateCard.create({
        data: {
          ...rateCard,
          description: sanitizeString(rateCard.description),
          unit: sanitizeString(rateCard.unit),
          bankName: sanitizeString(rateCard.bankName),
        },
      });
    }
  } catch (error) {
    console.error('Error seeding rate cards:', error);
  }
}

async function main() {
  try {
    await seedUsers();
    await seedClients();
    await seedRateCards();
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
