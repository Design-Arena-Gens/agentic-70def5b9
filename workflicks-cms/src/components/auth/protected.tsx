"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export const ProtectedRoute = ({
  children,
  allowRoles,
}: {
  children: React.ReactNode;
  allowRoles?: string[];
}) => {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  if (allowRoles && user?.role && !allowRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-100 text-center">
        <div className="rounded-3xl bg-white p-12 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-900">
            You do not have permission to access this module.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Contact a WorkFlicks super admin to extend your role permissions.
          </p>
        </div>
      </div>
    );
  }

  return children;
};
