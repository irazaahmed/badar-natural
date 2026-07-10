import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * The app has no public marketing site — it's an internal portal. Hitting the
 * root just routes by session role: a signed-in admin lands on the dashboard,
 * a customer on their self-service portal, everyone else on the login screen.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const role = session?.user?.role;
  redirect(role === "ADMIN" ? "/admin" : role === "CUSTOMER" ? "/portal" : "/login");
}
