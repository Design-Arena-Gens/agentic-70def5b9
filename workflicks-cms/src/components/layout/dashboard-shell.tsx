"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import type { Permission } from "@/lib/auth/roles";

const navItems: Array<{ href: string; label: string; permission: Permission }> = [
  { href: "/dashboard", label: "Overview", permission: "viewAnalytics" },
  { href: "/jobs", label: "Jobs", permission: "manageJobs" },
  { href: "/companies", label: "Companies", permission: "manageCompanies" },
  { href: "/users", label: "Users", permission: "manageAdmins" },
  { href: "/content", label: "Content", permission: "manageContent" },
  { href: "/settings", label: "Settings", permission: "manageSettings" },
];

export const DashboardShell = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const allowedItems = navItems.filter((item) =>
    user?.permissions.includes(item.permission),
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden min-h-screen flex-1 max-w-[220px] flex-col gap-4 border-r border-slate-200 bg-white px-6 py-8 md:flex">
        <Link href="/dashboard" className="text-lg font-semibold">
          WorkFlicks Console
        </Link>
        <div className="flex flex-col gap-1">
          {allowedItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>
      <main className="flex w-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex flex-col">
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="text-sm font-semibold">
              {user?.displayName ?? user?.email}
            </p>
            <p className="text-xs text-slate-400">
              Role: {user?.role ?? "unknown"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-slate-900 hover:text-slate-900"
          >
            Sign out
          </button>
        </header>
        <div className="flex-1 bg-slate-50 p-6">{children}</div>
      </main>
    </div>
  );
};
