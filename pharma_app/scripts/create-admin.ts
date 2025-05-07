import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@pharmaai.com";
  const password = "Admin@123"; // Change this to a secure password
  const name = "Admin User";

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("Admin user already exists");
    return;
  }

  // Create admin user
  const hashedPassword = await hash(password, 12);
  
  const admin = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log("Admin user created successfully:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 