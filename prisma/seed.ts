import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Function to sanitize strings
function sanitizeString(input: string): string {
  return input.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
}

const prisma = new PrismaClient();

async function main() {
  // Example: Seed an admin user
  const hashedPassword = await bcrypt.hash('admin@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: sanitizeString('Admin'),
      email: sanitizeString('admin@example.com'),
      password: hashedPassword,
      role: 'ADMIN',
      mobile: sanitizeString('1234567890'),
    },
  });

  console.log('✅ Admin user seeded');

  // Example: Seed a client
  const client = await prisma.client.upsert({
    where: { id: 'CL-001' },
    update: {},
    create: {
      id: 'CL-001',
      name: sanitizeString('Example Client'),
      type: sanitizeString('Bank'),
      totalBranches: 1,
      contactPerson: sanitizeString('John Doe'),
      contactEmail: sanitizeString('john.doe@example.com'),
      contactPhone: sanitizeString('9876543210'),
      contractStatus: sanitizeString('Active'),
      lastServiceDate: new Date(),
      initials: sanitizeString('EC'),
    },
  });

  console.log('✅ Client seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
