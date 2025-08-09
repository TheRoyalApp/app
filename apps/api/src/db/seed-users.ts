import { createUser } from '../use-cases/create-user';

async function seed() {
  const users = [
    {
      email: 'the.royal.barber@hotmail.com',
      password: '@Burroloco99',
      firstName: 'Admin',
      lastName: 'Manager',
      isAdmin: true,
      role: 'staff',
      phone: '+522204614789',
    },
    {
      email: 'admin@theroyalbarber.com',
      password: 'AdminPass123',
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      role: 'staff',
      phone: '+1234567890',
    }
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