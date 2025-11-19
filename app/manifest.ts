import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MONEE - Your Money, Finally in One Place",
    short_name: "MONEE",
    description:
      "Your simple, personal money assistant — built for real life in Kenya. Track, understand, and plan your money — all in one beautiful daily ritual.",
    start_url: "/",
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

