"use client";

import { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { companySchema } from "@/lib/validators";
import { apiClient } from "@/lib/api/client";
import type { Company } from "@/types";

const fetchCompanies = () => apiClient.get<{ companies: Company[] }>("/companies");
type CompanyFormValues = z.input<typeof companySchema>;

export default function CompaniesPage() {
  const { data, isLoading, error, mutate } = useSWR(
    "companies",
    fetchCompanies,
  );
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      status: "active",
    },
  });

  const onSubmit = async (values: CompanyFormValues) => {
    setSaving(true);
    await apiClient.post("/companies", values);
    await mutate();
    setSaving(false);
    reset({ status: "active" });
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-600">
        Failed to load companies. {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve employer profiles and manage brand assets.
        </p>
      </header>
      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Employer directory
          </h2>
          {isLoading && (
            <div className="mt-8 flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            </div>
          )}
          {!isLoading && data && (
            <ul className="mt-6 divide-y divide-slate-100">
              {data.companies.map((company) => (
                <li key={company.id} className="flex flex-col gap-2 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {company.name}
                      </h3>
                      {company.industry && (
                        <p className="text-xs text-slate-400">
                          {company.industry} • {company.location}
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        company.status === "active"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {company.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{company.description}</p>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-slate-500 hover:text-slate-900"
                    >
                      Visit website
                    </a>
                  )}
                </li>
              ))}
              {data.companies.length === 0 && (
                <li className="py-12 text-center text-sm text-slate-400">
                  No companies onboarded yet.
                </li>
              )}
            </ul>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Add company
          </h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 flex flex-col gap-4"
          >
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Name
              </span>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                {...register("name")}
              />
              {errors.name && (
                <span className="text-xs text-rose-500">
                  {errors.name.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Website
              </span>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                {...register("website")}
              />
              {errors.website && (
                <span className="text-xs text-rose-500">
                  {errors.website.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Industry
              </span>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                {...register("industry")}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Location
              </span>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                {...register("location")}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Description
              </span>
              <textarea
                className="h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                {...register("description")}
              />
              {errors.description && (
                <span className="text-xs text-rose-500">
                  {errors.description.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Status
              </span>
              <select
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
                {...register("status")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? "Saving..." : "Save company"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
