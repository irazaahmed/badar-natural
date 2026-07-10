import { compare, hash } from "bcryptjs";
import prisma from "@/lib/prisma";

/**
 * Verify admin login credentials against the AdminUser table.
 *
 * Bootstrap: if NO admin row exists yet, the first login is seeded from env
 * (ADMIN_EMAIL + ADMIN_PASSWORD_HASH, or ADMIN_PASSWORD as a dev fallback).
 * The env hash/password becomes the first stored credential, after which the
 * admin can change it from the settings screen and env is no longer consulted.
 *
 * Node-runtime only (uses prisma + bcrypt) — called from auth.ts, never from
 * the edge-safe auth.config.ts / proxy.ts.
 */
export async function verifyAdminCredentials(
  emailInput: string,
  password: string,
): Promise<{ id: string; email: string } | null> {
  const email = emailInput.trim().toLowerCase();
  if (!email || !password) return null;

  let admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin) {
    // Only bootstrap when the table is completely empty, so a wrong email can
    // never silently create a second admin.
    const existing = await prisma.adminUser.count();
    if (existing === 0) {
      const envEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
      const envHash = process.env.ADMIN_PASSWORD_HASH ?? "";
      const envPlain = process.env.ADMIN_PASSWORD ?? "";
      if (envEmail && email === envEmail) {
        const envOk = envHash
          ? await compare(password, envHash)
          : envPlain.length > 0 && password === envPlain;
        if (!envOk) return null;
        const passwordHash = envHash || (await hash(password, 10));
        admin = await prisma.adminUser.create({ data: { email: envEmail, passwordHash } });
      }
    }
  }

  if (!admin) return null;

  const ok = await compare(password, admin.passwordHash);
  if (!ok) return null;

  return { id: admin.id, email: admin.email };
}

/** Change the signed-in admin's password. Returns an error string or null. */
export async function changeAdminPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<string | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!admin) return "Admin account not found.";

  const ok = await compare(currentPassword, admin.passwordHash);
  if (!ok) return "Current password is incorrect.";

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await hash(newPassword, 10) },
  });
  return null;
}
