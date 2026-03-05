/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Serve static blog HTML without .html extension
      { source: "/blog", destination: "/blog/index.html" },
      { source: "/blog/:slug", destination: "/blog/:slug.html" },
    ];
  },
  async redirects() {
    return [
      // Old site URLs → new equivalents (preserve Google juice)
      { source: "/deploy-gate", destination: "/developers/quickstart", permanent: true },
      { source: "/install", destination: "/developers/quickstart", permanent: true },
      { source: "/request-access", destination: "/contact", permanent: true },
      { source: "/challenge", destination: "/", permanent: true },
      { source: "/architecture", destination: "/", permanent: true },
      { source: "/receipt-model", destination: "/r/demo", permanent: true },
      { source: "/present", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
