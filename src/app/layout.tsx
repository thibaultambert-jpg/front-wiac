import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Formations internes", template: "%s · Formations internes" },
  description: "Catalogue des formations inter et inscriptions des collaborateurs.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
