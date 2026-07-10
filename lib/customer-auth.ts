import { compare, hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { normalizePhone } from "@/lib/actions/utils";

/**
 * Verify a customer's self-service portal login. The username IS the customer's
 * phone number (normalized the same way it is stored), so a customer only has
 * access once the owner has both saved their phone and set a portal password.
 *
 * Node-runtime only (prisma + bcrypt) — called from auth.ts, never from the
 * edge-safe auth.config.ts / proxy.ts.
 */
export async function verifyCustomerCredentials(
  identifier: string,
  password: string,
): Promise<{ id: string; name: string } | null> {
  const phone = normalizePhone(identifier);
  if (!phone || !password) return null;

  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer || !customer.passwordHash) return null;

  const ok = await compare(password, customer.passwordHash);
  if (!ok) return null;

  return { id: customer.id, name: customer.name };
}

/** Hash a portal password for storage. Owner-provisioned from the customer form. */
export function hashCustomerPassword(password: string): Promise<string> {
  return hash(password, 10);
}
