import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MONEE - Personal Finance for Kenya",
    short_name: "MONEE",
    description:
      "Track expenses, manage debts, build savings. Your complete personal finance companion built for Kenya. Simple, fast, and intuitive.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/AppImages/android/android-launchericon-192-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/AppImages/android/android-launchericon-512-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

