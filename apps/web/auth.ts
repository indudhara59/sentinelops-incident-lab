import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { safeRedirectTarget } from "@/lib/auth/config";
import { readMongoConfiguration } from "@/lib/persistence/config";
import { COLLECTIONS } from "@/lib/persistence/model";
import { getMongoClient } from "@/lib/persistence/mongodb";

const mongoConfiguration = readMongoConfiguration();
const adapter = mongoConfiguration
  ? MongoDBAdapter(() => getMongoClient(), {
      databaseName: mongoConfiguration.databaseName,
      collections: {
        Users: COLLECTIONS.users,
        Accounts: COLLECTIONS.accounts,
        Sessions: COLLECTIONS.sessions,
      },
    })
  : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(adapter ? { adapter } : {}),
  providers: [Google],
  session: {
    strategy: adapter ? "database" : "jwt",
    maxAge: 12 * 60 * 60,
    updateAge: 60 * 60,
  },
  pages: { signIn: "/auth/signin", error: "/auth/signin" },
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-sentinelops.session-token"
          : "sentinelops.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    session({ session, user }) {
      if (session.user && user?.id) session.user.id = user.id;
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}${safeRedirectTarget(url)}`;
    },
    authorized({ auth: session, request }) {
      const protectedRoute =
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/settings");
      return !protectedRoute || Boolean(session?.user?.id);
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const db = (await getMongoClient()).db(mongoConfiguration?.databaseName);
      const now = new Date();
      await db.collection(COLLECTIONS.userPreferences).updateOne(
        { ownerId: user.id },
        {
          $setOnInsert: {
            ownerId: user.id,
            displayName: user.name?.slice(0, 80) ?? "Incident responder",
            theme: "system",
            reducedMotion: false,
            defaultSimulationSpeed: 1,
            telemetryDensity: "comfortable",
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true },
      );
    },
  },
});
