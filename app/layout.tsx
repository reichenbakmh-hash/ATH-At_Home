import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap"
});

export const metadata: Metadata = {
  title: "ATH — At Home",
  description: "Le planificateur privé de votre foyer."
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("ath-theme");
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored ? stored === "dark" : systemDark;
    document.documentElement.classList.toggle("dark", isDark);
  } catch (error) {}
})();
`;

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="fr" className={plexSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-6 pb-8 pt-16 md:px-10 md:py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
