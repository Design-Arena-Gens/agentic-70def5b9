"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, status, signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (status === "authenticated" && user?.role) {
      router.replace("/dashboard");
    }
  }, [status, router, user?.role]);

  const onSubmit = async (data: LoginForm) => {
    await signInWithEmail(data.email, data.password);
    router.replace("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-16">
      <div className="grid w-full max-w-5xl gap-12 rounded-3xl bg-white p-12 shadow-2xl sm:grid-cols-[3fr_2fr]">
        <section>
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-400">
            WorkFlicks.in
          </p>
          <h1 className="mt-6 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Login to the WorkFlicks Operations Console
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            Manage jobs, companies, recruiters, and CMS content with secure
            role-based workflows.
          </p>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 flex flex-col gap-6"
          >
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Business Email
              </span>
              <input
                type="email"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="you@workflicks.in"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <span className="text-xs text-rose-500">
                  {errors.email.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Password
              </span>
              <input
                type="password"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <span className="text-xs text-rose-500">
                  {errors.password.message}
                </span>
              )}
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={async () => {
                await signInWithGoogle();
                router.replace("/dashboard");
              }}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              <span>Sign in with Google</span>
            </button>
            <p className="mt-4 text-xs text-slate-400">
              Google SSO is locked to @workflicks.in accounts via Firebase
              Authentication.
            </p>
          </div>
        </section>
        <aside className="hidden flex-col justify-between rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 p-8 text-white sm:flex">
          <div>
            <h2 className="text-lg font-semibold">Operational insights</h2>
            <p className="mt-3 text-sm text-white/70">
              Track job lifecycle velocity, recruiter performance, and candidate
              quality scores in real time with Firestore-powered analytics.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-white/70">
            <li>• Enforce least privilege access with custom claims.</li>
            <li>• Approve company branding assets via Cloud Storage.</li>
            <li>• Automate approvals and notifications with Cloud Functions.</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
