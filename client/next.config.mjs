/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  async rewrites() {
    const apiProxyUrl = process.env.API_PROXY_URL?.replace(/\/$/, "");

    if (!apiProxyUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyUrl}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
