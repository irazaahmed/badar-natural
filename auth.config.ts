import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration.
 *
 * This file must NOT import prisma or bcryptjs — it is consumed by
 * `proxy.ts` (edge runtime) to decode/validate the session JWT. The
 * Credentials provider (which needs Node APIs) lives in `auth.ts`.
 */
export const authConfig = {
  // Required for `next start` locally; Vercel sets AUTH_TRUST_HOST itself.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    // Filled in by auth.ts (Credentials provider needs bcryptjs, which is
    // not edge-safe). Left empty here on purpose.
  ],
  callbacks: {
    // Runs when the JWT is created (sign-in) or updated.
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.customerId = user.customerId;
      }
      return token;
    },
    // Runs whenever the session is read (server components, proxy, client).
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      session.user.role = token.role;
      session.user.customerId = token.customerId;
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
