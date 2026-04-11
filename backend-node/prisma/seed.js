const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("demo1234", 10);
  await prisma.user.upsert({
    where: { email: "demo@prepai.com" },
    update: {},
    create: {
      email: "demo@prepai.com",
      name: "Demo User",
      password: hashed,
    },
  });
  console.log("✅ Seed done — login: demo@prepai.com / demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());