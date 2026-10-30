export default {
  async headers() {
    return [
      {
        source: "/reset-password",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  experimental: {
    inlineCss: true,
    useCache: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "ecommercebackendjava-production.up.railway.app",
        pathname: "/uploads/products/**",
      },
      {
        protocol: "https",
        hostname: "ecommercebackendjava-homolog.up.railway.app",
        pathname: "/uploads/products/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dmqfiovod/image/upload/**",
      },
    ],
  },
};
