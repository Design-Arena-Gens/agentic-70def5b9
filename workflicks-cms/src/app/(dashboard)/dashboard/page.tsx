"use client";

import useSWR from "swr";
import { apiClient } from "@/lib/api/client";

type MetricsResponse = {
  totals: {
    jobs: number;
    companies: number;
    recruiters: number;
    publishedJobs: number;
  };
  pipeline: Array<{ status: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: string;
    summary: string;
    timestamp: string;
  }>;
};

const fetcher = () => apiClient.get<MetricsResponse>("/dashboard/metrics");

export default function DashboardPage() {
  const { data, isLoading, error } = useSWR("dashboard-metrics", fetcher, {
    refreshInterval: 30000,
  });

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-600">
        Failed to load analytics. {error.message}
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Platform Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor WorkFlicks job distribution, recruiter performance, and
          onboarding activity in real time.
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Jobs"
          value={data.totals.jobs}
          description={`${data.totals.publishedJobs} published`}
        />
        <MetricCard
          label="Active Companies"
          value={data.totals.companies}
          description="Approved employers"
        />
        <MetricCard
          label="Recruiters"
          value={data.totals.recruiters}
          description="Verified platform users"
        />
        <MetricCard
          label="Published Jobs"
          value={data.totals.publishedJobs}
          description="Live on WorkFlicks.in"
        />
      </section>
      <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Job pipeline health
          </h2>
          <div className="mt-6 space-y-4">
            {data.pipeline.map((status) => (
              <div key={status.status} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize text-slate-700">
                    {status.status}
                  </span>
                  <span className="text-slate-500">{status.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-900 transition-all"
                    style={{
                      width: `${Math.min(status.count * 12, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent activity
          </h2>
          <ul className="mt-4 space-y-4">
            {data.recentActivity.map((activity) => (
              <li key={activity.id} className="space-y-1 text-sm">
                <p className="font-medium text-slate-700">{activity.summary}</p>
                <p className="text-xs text-slate-400">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

const MetricCard = ({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
      {label}
    </p>
    <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
    <p className="mt-2 text-xs text-slate-500">{description}</p>
  </div>
);
