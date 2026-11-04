import { z } from "zod";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from "@/lib/admin-auth";

const loginSchema = z.object({
  username: z.string().max(100),
  password: z.string().max(100),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Username and password are required" }, { status: 400 });
  }
  if (parsed.data.username !== "admin" || parsed.data.password !== "1234") {
    return Response.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const sessionToken = createAdminSessionToken();
  (await cookies()).set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
  return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}
