import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	// Read allowed origins from env (comma-separated) and normalize
	const allowedEnv = process.env.CORS_ORIGIN || "http://localhost:3001";
	const allowedOrigins = allowedEnv
		.split(",")
		.map((s) => s.trim().replace(/\/+$/, ""))
		.filter(Boolean);

	const origin = (request.headers.get("origin") || "").replace(/\/+$/, "");

	const isOriginAllowed = (o: string) => {
		if (!o) return false;
		if (allowedOrigins.includes("*")) return true;
		return allowedOrigins.some((a) => a === o || a === `${o}`);
	};

	const resolvedAllowOrigin = () => {
		if (origin && isOriginAllowed(origin)) return origin;
		// fallback to first allowed origin (no trailing slash)
		return allowedOrigins[0] ?? "*";
	};

	// Handle preflight OPTIONS request
	if (request.method === "OPTIONS") {
		const response = new NextResponse(null, { status: 200 });

		response.headers.append("Access-Control-Allow-Credentials", "true");
		response.headers.append("Access-Control-Allow-Origin", resolvedAllowOrigin());
		response.headers.append("Vary", "Origin");
		response.headers.append(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS"
		);
		response.headers.append(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization, X-Requested-With"
		);

		return response;
	}

	const res = NextResponse.next();

	res.headers.append("Access-Control-Allow-Credentials", "true");
	res.headers.append("Access-Control-Allow-Origin", resolvedAllowOrigin());
	res.headers.append("Vary", "Origin");
	res.headers.append("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.headers.append(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, X-Requested-With"
	);

	return res;
}

export const config = {
	matcher: "/:path*",
};
