import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Full administrative access' },
  });

  await prisma.role.upsert({
    where: { name: 'moderator' },
    update: {},
    create: { name: 'moderator', description: 'Can moderate boards' },
  });

  await prisma.role.upsert({
    where: { name: 'member' },
    update: {},
    create: { name: 'member', description: 'Default role for new members' },
  });

  const adminPasswordHash = await argon2.hash(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!');
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      displayName: 'Administrator',
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  await prisma.board.upsert({
    where: { slug: 'general-discussion' },
    update: {},
    create: {
      name: 'General Discussion',
      slug: 'general-discussion',
      description: 'Talk about anything here.',
      displayOrder: 0,
    },
  });

  console.log('Seed complete. Admin login: admin / (see SEED_ADMIN_PASSWORD or default ChangeMe123!)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
