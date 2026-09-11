import crypto from "node:crypto";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/app/lib/prisma";
import { sendVerificationEmail } from "@/app/lib/mailer";

const SignupSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().or(z.literal("")),
  email: z.email().trim().max(255),
  password: z.string().min(8).max(200),
});

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid name, email and password (8+ characters)." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const name = parsed.data.name || null;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  try {
    const token = crypto.randomBytes(32).toString("hex");

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
    });

    const origin = new URL(request.url).origin;
    const verifyUrl = `${origin}/api/auth/verify?token=${token}&email=${encodeURIComponent(
      email,
    )}`;

    await sendVerificationEmail(email, verifyUrl);
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }

  return NextResponse.json({ id: user.id, email: user.email });
}
