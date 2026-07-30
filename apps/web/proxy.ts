import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { auth } from "@/auth";
import { authenticationConfigured } from "@/lib/auth/config";

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!authenticationConfigured()) {
    const signIn = new URL("/auth/signin", request.url);
    signIn.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(signIn);
  }
  return (
    auth as unknown as (
      request: NextRequest,
      event: NextFetchEvent,
    ) => Promise<Response>
  )(request, event);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/scenario-builder/:path*",
  ],
};
