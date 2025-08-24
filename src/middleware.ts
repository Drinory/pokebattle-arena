import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER = process.env.BASIC_USER ?? "demo";
const PASS = process.env.BASIC_PASS ?? "demo123";

export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) {
    return new NextResponse("Auth required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' }
    });
  }
  const [u, p] = atob(auth.slice(6)).split(":");
  if (u !== USER || p !== PASS) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
// HACK: creds via env for demo; real apps use an auth provider.
