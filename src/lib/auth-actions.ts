"use server";

import { prisma } from "@/lib/db";
import {
  hashPassword,
  comparePassword,
  createToken,
  setAuthCookie,
  clearAuthCookie,
  getCurrentUser,
  type TokenPayload,
} from "@/lib/auth";
import { redirect } from "next/navigation";

export async function registerUser(
  email: string,
  username: string,
  password: string
): Promise<{ error?: string }> {
  if (!email || !username || !password) {
    return { error: "所有字段都必须填写" };
  }
  if (password.length < 6) {
    return { error: "密码至少 6 位" };
  }
  if (!email.includes("@")) {
    return { error: "请输入有效的邮箱地址" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "该邮箱已注册" };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, username, passwordHash, emailVerified: true },
  });

  // Auto-login after registration in dev mode
  const token = await createToken({
    userId: user.id,
    email: user.email,
    username: user.username,
  });
  await setAuthCookie(token);

  return {};
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ error?: string }> {
  if (!email || !password) {
    return { error: "请输入邮箱和密码" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "邮箱或密码错误" };
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return { error: "邮箱或密码错误" };
  }

  const token = await createToken({
    userId: user.id,
    email: user.email,
    username: user.username,
  });
  await setAuthCookie(token);

  return {};
}

export async function logoutUser(): Promise<void> {
  await clearAuthCookie();
  redirect("/auth/login");
}

export async function requireAuth(): Promise<TokenPayload> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}
