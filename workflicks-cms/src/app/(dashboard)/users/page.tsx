"use client";

import { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api/client";
import { ROLES } from "@/lib/auth/roles";
import { userSchema, type UserInput } from "@/lib/validators";
import type { AppUser, Company } from "@/types";

type UsersResponse = {
  users: AppUser[];
  companies: Company[];
};

const fetchUsers = () => apiClient.get<UsersResponse>("/users");

export default function UsersPage() {
  const { data, isLoading, error, mutate } = useSWR("users", fetchUsers);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] =
    useState<UserInput["role"]>("recruiter");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "recruiter",
    },
  });

  const roleRegister = register("role", {
    onChange: (event) =>
      setSelectedRole(event.target.value as UserInput["role"]),
  });

  const onSubmit = async (values: UserInput) => {
    setSaving(true);
    await apiClient.post("/users", values);
    await mutate();
    reset({ role: "recruiter" });
    setSelectedRole("recruiter");
    setSaving(false);
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-600">
        Failed to load users. {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          User management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Invite team members, assign roles, and manage access.
        </p>
      </header>
      <section className="grid gap-6 xl:grid-cols-[3fr,2fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Platform members
          </h2>
          {isLoading && (
            <div className="mt-8 flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            </div>
          )}
          {!isLoading && data && (
            <table className="mt-6 w-full table-fixed border-separate border-spacing-y-3 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-3">User</th>
                  <th className="px-3">Role</th>
                  <th className="px-3">Company</th>
                  <th className="px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id} className="rounded-2xl bg-slate-50">
                    <td className="rounded-l-2xl px-3 py-4">
                      <p className="font-semibold text-slate-900">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-3">
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 text-xs text-slate-500">
                      {data.companies.find((c) => c.id === user.companyId)
                        ?.name ?? "—"}
                    </td>
                    <td className="rounded-r-2xl px-3 text-xs font-semibold text-emerald-600">
                      {user.disabled ? "Disabled" : "Active"}
                    </td>
                  </tr>
                ))}
                {data.users.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-xs text-slate-400"
                    >
                      No users available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Invite user</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 flex flex-col gap-4"
          >
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Email
              </span>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                {...register("email")}
              />
              {errors.email && (
                <span className="text-xs text-rose-500">
                  {errors.email.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Full name
              </span>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                {...register("displayName")}
              />
              {errors.displayName && (
                <span className="text-xs text-rose-500">
                  {errors.displayName.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Role
              </span>
              <select
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm capitalize"
                {...roleRegister}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            {selectedRole === "recruiter" && (
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Assign company
                </span>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
                  {...register("companyId")}
                >
                  <option value="">Select company</option>
                  {data?.companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors.companyId && (
                  <span className="text-xs text-rose-500">
                    {errors.companyId.message}
                  </span>
                )}
              </label>
            )}
            <button
              type="submit"
              disabled={saving}
              className="mt-4 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? "Sending..." : "Send invite"}
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-400">
            Invited users receive onboarding email via Firebase Auth action
            handlers.
          </p>
        </div>
      </section>
    </div>
  );
}
