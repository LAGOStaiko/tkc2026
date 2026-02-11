import { unauthorized } from "./response";

type ClerkEnv = {
  CLERK_SECRET_KEY?: string;
};

/**
 * Verifies a Clerk session token from the Authorization header.
 * Returns a Response (error) if auth fails, or null if auth passes.
 */
export async function requireClerkAuth(
  env: ClerkEnv,
  request: Request
): Promise<Response | null> {
  const secret = env.CLERK_SECRET_KEY?.trim();
  if (!secret) {
    return unauthorized("Server is not configured for Clerk auth");
  }

  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return unauthorized("Missing or invalid Authorization header");
  }

  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return unauthorized("Empty token");
  }

  try {
    const response = await fetch("https://api.clerk.com/v1/me", {
      headers: {
        Authorization: `Bearer ${secret}`,
        "X-Clerk-Session-Token": token,
      },
    });

    if (!response.ok) {
      return unauthorized("Invalid session token");
    }

    return null;
  } catch {
    return unauthorized("Auth verification failed");
  }
}
