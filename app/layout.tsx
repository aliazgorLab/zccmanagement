import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Hind_Siliguri } from "next/font/google";
import AppShell from "@/app/AppShell";
import Providers from "@/app/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const bangla = Hind_Siliguri({
  variable: "--font-bangla",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Zahids Chem Clinic",
  description: "Clinic management dashboard for admissions and daily summary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} ${bangla.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
