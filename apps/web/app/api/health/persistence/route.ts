import { checkDatabaseHealth } from "@/lib/persistence/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkDatabaseHealth();
  return Response.json(health, {
    status: health.status === "available" ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
