import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pagini accesibile fără cont. Un utilizator autentificat e trimis la dashboard.
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];
// Accesibile oricui: aici utilizatorul încă nu are sesiune, dar o va primi.
const AUTH_FLOW_ROUTES = ['/auth/confirm'];

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request });

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
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    if (AUTH_FLOW_ROUTES.some((route) => pathname.startsWith(route))) {
        return response;
    }

    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

    if (!user && !isPublic) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user && isPublic) {
        return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};