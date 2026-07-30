import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { authenticationConfigured } from "./config";

export async function requireOwner(callbackPath = "/dashboard") {
  if (!authenticationConfigured()) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
  return session.user;
}
