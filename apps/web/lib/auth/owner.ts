import "server-only";
import { auth } from "@/auth";
import { authenticationConfigured } from "./config";

export async function authenticatedOwnerId(): Promise<string | null> {
  if (!authenticationConfigured()) return null;
  return (await auth())?.user?.id ?? null;
}
