import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  let cookiesToApply: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToApply = cookiesToSet;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";

  if (!isLoginPage && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isLoginPage && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Trusted by lib/auth.ts to skip a second auth.getUser() network round trip.
  // Always overwritten here, so a client-supplied header can never survive.
  if (user) requestHeaders.set("x-user-id", user.id);
  else requestHeaders.delete("x-user-id");

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  cookiesToApply.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
