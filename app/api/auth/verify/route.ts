import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(`${origin}/?verified=0`);
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return NextResponse.redirect(`${origin}/?verified=0`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    }),
  ]);

  return NextResponse.redirect(`${origin}/?verified=1`);
}
