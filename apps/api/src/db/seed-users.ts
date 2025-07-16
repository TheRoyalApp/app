import { createUser } from '../use-cases/create-user';

async function seed() {
  const users = [
    {
      email: 'barber@theroyalbarber.com',
      password: 'BarberPass123',
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      isAdmin: false,
      role: 'staff',
      phone: '+1234567890',
    },
    {
      email: 'admin@theroyalbarber.com',
      password: 'AdminPass123',
      firstName: 'Admin',
      lastName: 'Manager',
      isAdmin: true,
      role: 'staff',
      phone: '+1234567891',
    },
    {
      email: 'staff@example.com',
      password: 'StaffPass123',
      firstName: 'Staff',
      lastName: 'User',
      isAdmin: false,
      role: 'staff',
      phone: '+1234567892',
    },
  ];

  for (const user of users) {
    const result = await createUser(user as any);
    if (result.error) {
      console.error(`Failed to create user ${user.email}:`, result.error);
    } else {
      console.log(`Created user: ${user.email}`);
    }
  }
  process.exit(0);
}

seed(); 