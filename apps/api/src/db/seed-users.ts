import { createUser } from '../use-cases/create-user';

async function seed() {
  const users = [
    {
      email: 'admin@example.com',
      password: 'AdminPass123',
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      role: 'admin',
    },
    {
      email: 'staff@example.com',
      password: 'StaffPass123',
      firstName: 'Staff',
      lastName: 'User',
      isAdmin: false,
      role: 'staff',
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