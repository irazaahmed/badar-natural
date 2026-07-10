import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import { verifyAdminCredentials } from "@/lib/admin-auth";
import { verifyCustomerCredentials } from "@/lib/customer-auth";

/**
 * Full (Node runtime) Auth.js instance: edge-safe base config from
 * auth.config.ts + the Credentials provider.
 *
 * Two login paths through ONE form (identifier + password):
 *   - ADMIN — the owner/staff. Identifier is the email in the AdminUser table
 *     (see lib/admin-auth.ts); first login is bootstrapped from env.
 *   - CUSTOMER — a wholesale / regular customer's read-only portal. Identifier
 *     is their phone number; access exists only once the owner sets a portal
 *     password on the Customer row (see lib/customer-auth.ts).
 * Admin is tried first (an email never normalizes to a matching phone).
 *
 * Import `auth`, `signIn`, `signOut` from here everywhere EXCEPT proxy.ts
 * (proxy builds its own edge-safe instance from auth.config.ts).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email or phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        const admin = await verifyAdminCredentials(identifier, password);
        if (admin) {
          return { id: admin.id, email: admin.email, role: "ADMIN" as const };
        }

        const customer = await verifyCustomerCredentials(identifier, password);
        if (customer) {
          return {
            id: customer.id,
            name: customer.name,
            role: "CUSTOMER" as const,
            customerId: customer.id,
          };
        }

        return null;
      },
    }),
  ],
});
