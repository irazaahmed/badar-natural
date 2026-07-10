"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type LoginState = { error: string } | undefined;

/**
 * Server action for the /login form. On success, signIn issues a redirect
 * (thrown as NEXT_REDIRECT — must be re-thrown) to "/", which then routes to
 * /admin or the customer /portal based on the session role. On bad
 * credentials, returns an error message for the form to display.
 *
 * One form, two roles: admins sign in with their email, customers with their
 * phone number.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const idRaw = formData.get("email");
  const identifier = typeof idRaw === "string" ? idRaw.trim() : "";

  try {
    await signIn("credentials", {
      email: identifier,
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid login or password." };
    }
    throw error; // re-throw NEXT_REDIRECT so the redirect happens
  }
}

/** Server action to sign out; usable from any form (see SignOutButton). */
export async function logout() {
  await signOut({ redirectTo: "/login" });
}
