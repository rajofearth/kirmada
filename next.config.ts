import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "p4cwzmlmceqweu4s.public.blob.vercel-storage.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
