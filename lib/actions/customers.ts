"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, CustomerType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { hashCustomerPassword } from "@/lib/customer-auth";
import { requireAdmin, field, fieldOrNull, moneyField, normalizePhone, type FormState } from "./utils";

function parseType(formData: FormData): CustomerType {
  return field(formData, "type") === "RETAIL_REGULAR"
    ? CustomerType.RETAIL_REGULAR
    : CustomerType.WHOLESALE;
}

/**
 * Parse the optional standing discount (%) and credit limit (Rs.) (§7.2).
 * Empty fields → null (no discount / unlimited credit). Throws on invalid input.
 */
function parseTerms(formData: FormData): { discountPercent: Prisma.Decimal | null; creditLimit: Prisma.Decimal | null } {
  const discountPercent = moneyField(formData, "discountPercent");
  const creditLimit = moneyField(formData, "creditLimit");
  if (discountPercent && (discountPercent.lt(0) || discountPercent.gt(100)))
    throw new Error("Discount must be between 0 and 100%.");
  if (creditLimit && creditLimit.lt(0)) throw new Error("Credit limit cannot be negative.");
  return { discountPercent: discountPercent ?? null, creditLimit: creditLimit ?? null };
}

/**
 * Owner-provisioned portal login. Returns the password hash to store, `null`
 * to explicitly revoke access, or `undefined` to leave it untouched. Throws a
 * user-facing message when the request is invalid (too short, or no phone —
 * the phone IS the login username).
 */
async function resolvePortalPassword(
  formData: FormData,
  phone: string,
): Promise<string | null | undefined> {
  if (field(formData, "removePortalAccess") === "on") return null;
  const pw = field(formData, "portalPassword");
  if (!pw) return undefined;
  if (pw.length < 4) throw new Error("Portal password must be at least 4 characters.");
  if (!phone) throw new Error("A phone number is required to enable portal login.");
  return hashCustomerPassword(pw);
}

/**
 * Save a customer. Phone is the unique key when present — the form upserts by
 * phone so the same wholesale buyer is never duplicated. Anonymous retail
 * walk-ins never reach here.
 */
export async function saveCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = field(formData, "name");
  const phone = normalizePhone(field(formData, "phone"));
  const address = fieldOrNull(formData, "address");
  const type = parseType(formData);
  if (!name) return { error: "Customer name is required." };

  let passwordHash: string | null | undefined;
  let terms: { discountPercent: Prisma.Decimal | null; creditLimit: Prisma.Decimal | null };
  try {
    passwordHash = await resolvePortalPassword(formData, phone);
    terms = parseTerms(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid customer details." };
  }
  const pwData = passwordHash === undefined ? {} : { passwordHash };

  if (phone) {
    await prisma.customer.upsert({
      where: { phone },
      update: { name, address, type, ...terms, ...pwData },
      create: { name, phone, address, type, ...terms, ...pwData },
    });
  } else {
    await prisma.customer.create({ data: { name, address, type, ...terms } });
  }

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function updateCustomer(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const name = field(formData, "name");
  const phone = normalizePhone(field(formData, "phone"));
  const address = fieldOrNull(formData, "address");
  const type = parseType(formData);
  if (!name) return { error: "Customer name is required." };

  let passwordHash: string | null | undefined;
  let terms: { discountPercent: Prisma.Decimal | null; creditLimit: Prisma.Decimal | null };
  try {
    passwordHash = await resolvePortalPassword(formData, phone);
    terms = parseTerms(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid customer details." };
  }

  try {
    await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        address,
        type,
        ...terms,
        ...(passwordHash === undefined ? {} : { passwordHash }),
      },
    });
  } catch {
    return { error: "Another customer already uses that phone number." };
  }

  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${id}`);
}

export async function deleteCustomer(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const sales = await prisma.sale.count({ where: { customerId: id } });
  if (sales > 0) {
    return { error: "Cannot delete a customer with sales history." };
  }
  await prisma.$transaction([
    prisma.customerLedgerEntry.deleteMany({ where: { customerId: id } }),
    prisma.customer.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/customers");
  return {};
}

/**
 * Resolve a customer for the sale forms inside a transaction. Priority: an
 * explicit customerId, else inline name (+ optional phone). When a phone is
 * given it upserts by phone; otherwise it creates a bare row. Returns null when
 * nothing was supplied (anonymous retail walk-in).
 */
export async function resolveCustomer(
  tx: Prisma.TransactionClient,
  input: {
    customerId?: string | null;
    name?: string | null;
    phone?: string | null;
    type?: CustomerType;
  },
): Promise<string | null> {
  if (input.customerId) return input.customerId;

  const name = (input.name ?? "").trim();
  const phone = normalizePhone(input.phone ?? "");
  if (!name && !phone) return null;

  const type = input.type ?? CustomerType.WHOLESALE;
  if (phone) {
    const c = await tx.customer.upsert({
      where: { phone },
      update: name ? { name } : {},
      create: { name: name || "Customer", phone, type },
    });
    return c.id;
  }
  const c = await tx.customer.create({ data: { name, type } });
  return c.id;
}
