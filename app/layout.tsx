import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Hind_Siliguri } from "next/font/google";
import Link from "next/link";
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
        <div className="min-h-screen lg:flex">
          <aside className="border-r border-slate-200 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/80 lg:w-72 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
            <div className="flex h-full flex-col p-6 lg:p-8">
              <Link href="/" className="group inline-flex flex-col gap-1">
                <span className="text-2xl font-semibold tracking-tight text-slate-900">
                  ZCC
                </span>
                <span className="text-sm text-slate-500">
                  Zahids Chem Clinic
                </span>
              </Link>

              <nav className="mt-10 space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admission"
                  className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Student Admission
                </Link>
                <Link
                  href="/students"
                  className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Student Management
                </Link>
                <Link
                  href="/expenses"
                  className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Daily Expenses
                </Link>
              </nav>

              <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">Quick access</p>
                <p className="mt-1 text-sm text-slate-500">
                  Switch between daily summary, student admissions, and expense entries.
                </p>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
