"use client";

import { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api/client";
import { z } from "zod";
import { jobSchema } from "@/lib/validators";
import type { Job } from "@/types";

const fetchJobs = () => apiClient.get<{ jobs: Job[]; companies: Record<string, string> }>("/jobs");
type JobFormValues = z.input<typeof jobSchema>;

export default function JobsPage() {
  const { data, error, isLoading, mutate } = useSWR("jobs", fetchJobs);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      employmentType: "full-time",
      experienceLevel: "mid",
      skills: [],
      status: "draft",
      currency: "INR",
      remoteFriendly: true,
    },
  });

  const onSubmit = async (values: JobFormValues) => {
    setSubmitting(true);
    await apiClient.post("/jobs", values);
    await mutate();
    reset();
    setSubmitting(false);
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-600">
        Failed to load jobs. {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
        <p className="text-sm text-slate-500">
          Publish openings, control visibility, and assign recruiters.
        </p>
      </header>
      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Active job postings
          </h2>
          {isLoading && (
            <div className="mt-8 flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            </div>
          )}
          {!isLoading && data && (
            <ul className="mt-6 divide-y divide-slate-100">
              {data.jobs.map((job) => (
                <li key={job.id} className="flex flex-col gap-2 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {data.companies[job.companyId] ?? "Unknown company"} •{" "}
                        {job.location} • {job.employmentType}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        job.status === "published"
                          ? "bg-emerald-100 text-emerald-700"
                          : job.status === "draft"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
              {data.jobs.length === 0 && (
                <li className="py-12 text-center text-sm text-slate-400">
                  No jobs yet. Add your first opening from the form.
                </li>
              )}
            </ul>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Create job
          </h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 flex flex-col gap-4"
          >
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Title
              </span>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                {...register("title")}
              />
              {errors.title && (
                <span className="text-xs text-rose-500">
                  {errors.title.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Company
              </span>
              <select
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                {...register("companyId")}
              >
                <option value="">Select a company</option>
                {data?.companies &&
                  Object.entries(data.companies).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
              </select>
              {errors.companyId && (
                <span className="text-xs text-rose-500">
                  {errors.companyId.message}
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Employment
                </span>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
                  {...register("employmentType")}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Experience
                </span>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
                  {...register("experienceLevel")}
                >
                  <option value="entry">Entry</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                </select>
              </label>
            </div>
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
                Skills (comma separated)
              </span>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                {...register("skills", {
                  setValueAs: (value: string) =>
                    value
                      .split(",")
                      .map((skill) => skill.trim())
                      .filter(Boolean),
                })}
              />
              {errors.skills && (
                <span className="text-xs text-rose-500">
                  {errors.skills.message as string}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Description
              </span>
              <textarea
                className="h-32 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                {...register("description")}
              />
              {errors.description && (
                <span className="text-xs text-rose-500">
                  {errors.description.message}
                </span>
              )}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("remoteFriendly")} />
              <span className="text-xs text-slate-500">
                Remote friendly opportunity
              </span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Status
              </span>
              <select
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
                {...register("status")}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Saving..." : "Save job"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
