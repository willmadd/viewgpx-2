import { prisma } from "@/app/lib/prisma";

export const isAdmin = async (userId: string) => {
  const admin = await prisma.admins.findUnique({
    where: { user_id: userId },
  });

  return admin !== null;
};
