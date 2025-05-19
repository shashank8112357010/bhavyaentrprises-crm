import { PrismaClient, Role, TicketStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Admin user
  const hashedPassword = await bcrypt.hash('admin@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'girish@praarabdh.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'girish@praarabdh.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Admin user seeded');

  // 2. Seed Clients
  const clientsData = [
    {
      id: 'CL-001',
      name: 'HDFC Bank',
      type: 'Bank',
      totalBranches: 42,
      contactPerson: 'Sanjay Mehta',
      contactEmail: 'sanjay.mehta@hdfcbank.com',
      contactPhone: '+91-98765-43210',
      contractStatus: 'Active',
      lastServiceDate: new Date('2023-09-10'),
      avatar: '/logos/hdfc.png',
      initials: 'HB',
    },
    {
      id: 'CL-002',
      name: 'ICICI Bank',
      type: 'Bank',
      totalBranches: 38,
      contactPerson: 'Priya Malhotra',
      contactEmail: 'priya.malhotra@icicibank.com',
      contactPhone: '+91-98765-43211',
      contractStatus: 'Active',
      lastServiceDate: new Date('2023-09-08'),
      avatar: '/logos/icici.png',
      initials: 'IB',
    },
    {
      id: 'CL-003',
      name: 'SBI Bank',
      type: 'Bank',
      totalBranches: 56,
      contactPerson: 'Ravi Kumar',
      contactEmail: 'ravi.kumar@sbi.co.in',
      contactPhone: '+91-98765-43212',
      contractStatus: 'Active',
      lastServiceDate: new Date('2023-09-12'),
      avatar: '/logos/sbi.png',
      initials: 'SB',
    },
  ];

  for (const client of clientsData) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: {},
      create: client,
    });
  }

  console.log('✅ Clients seeded');

  // 3. Default WorkStage template
  const defaultWorkStageTemplate = {
    stateName: 'Delhi',
    adminName: 'Admin',
    clientName: 'ABC Corp',
    siteName: 'Main Site',
    quoteNo: 'Q0001',
    dateReceived: new Date(),
    quoteTaxable: 100000,
    quoteAmount: 118000,
    workStatus: 'Pending',
    approval: 'Not Started',
    poStatus: 'NA',
    poNumber: '',
    jcrStatus: 'NA',
    agentName: 'Agent X',
  };

  // 4. Seed Tickets for Clients
  // We will link tickets to clients via clientId & assign adminUser

  // Helper to find client by name
  async function getClientIdByName(name: string) {
    const client = await prisma.client.findFirst({ where: { name } });
    if (!client) throw new Error(`Client not found: ${name}`);
    return client.id;
  }

  // Ticket samples (you can add more as needed)
  const ticketsData = [
    {
      id: 'HDFC-223',
      title: 'Faulty AC in Meeting Room',
      clientName: 'HDFC Bank',
      branch: 'Mumbai North',
      priority: 'Medium',
      assigneeId: adminUser.id,
      status: TicketStatus.new,
      dueDate: new Date('2023-09-18'),
      createdAt: new Date(),
      description: 'The AC in the main meeting room is not cooling properly and making noise.',
      comments: 2,
      holdReason: null,
    },
    {
      id: 'SBI-092',
      title: 'Water leakage in restroom',
      clientName: 'SBI Bank',
      branch: 'Delhi East',
      priority: 'High',
      assigneeId: adminUser.id,
      status: TicketStatus.new,
      dueDate: new Date('2023-09-15'),
      createdAt: new Date(),
      description: 'There is water leakage from the ceiling in the staff restroom on the first floor.',
      comments: 0,
      holdReason: null,
    },
    {
      id: 'ICICI-103',
      title: 'Water leakage in ATM area',
      clientName: 'ICICI Bank',
      branch: 'Delhi Central',
      priority: 'High',
      assigneeId: adminUser.id,
      status: TicketStatus.inProgress,
      dueDate: new Date('2023-09-15'),
      createdAt: new Date(),
      description: 'Water leakage from ceiling above ATM machines. Risk of electrical short circuit.',
      comments: 3,
      holdReason: null,
    },
  ];

  for (const ticket of ticketsData) {
    const clientId = await getClientIdByName(ticket.clientName);

    // Create WorkStage for ticket
    const workStage = await prisma.workStage.create({
      data: {
        ...defaultWorkStageTemplate,
        clientName: ticket.clientName,
      },
    });

    await prisma.ticket.upsert({
      where: { id: ticket.id },
      update: {},
      create: {
        id: ticket.id,
        title: ticket.title,
        clientId,
        branch: ticket.branch,
        priority: ticket.priority,
        dueDate: ticket.dueDate,
        createdAt: ticket.createdAt,
        description: ticket.description,
        comments: ticket.comments,
        holdReason: ticket.holdReason,
        assigneeId: ticket.assigneeId,
        status: ticket.status,
        workStageId: workStage.id,
      },
    });
  }

  console.log('✅ Tickets seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
