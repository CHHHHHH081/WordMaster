import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const result = await p.user.updateMany({
    data: { emailVerified: true, verifyToken: null }
  });
  console.log("Auto-verified", result.count, "users");
  const users = await p.user.findMany({ select: { id: true, email: true, emailVerified: true } });
  console.log("Users:", JSON.stringify(users, null, 2));
  await p.$disconnect();
})();
