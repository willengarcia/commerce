import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const siteName = process.env.SITE_NAME || "Platun";

  return {
    name: siteName,
    short_name: siteName,
    description: "Loja online Platun",
    start_url: "/",
    display: "standalone",
    background_color: "#171717",
    theme_color: "#171717",
    icons: [
      {
        src: "/brand/platun-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/platun-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
