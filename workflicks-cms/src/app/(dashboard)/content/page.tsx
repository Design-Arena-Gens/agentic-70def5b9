"use client";

import { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api/client";
import { z } from "zod";

const contentSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  body: z.string().min(10),
  status: z.enum(["draft", "published"]),
});

type ContentInput = z.infer<typeof contentSchema>;

type ContentItem = ContentInput & {
  id: string;
  updatedAt: string;
};

const fetchContent = () =>
  apiClient.get<{ content: ContentItem[] }>("/content");

export default function ContentPage() {
  const { data, mutate, isLoading, error } = useSWR(
    "content",
    fetchContent,
  );
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContentInput>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      status: "draft",
    },
  });

  const onSubmit = async (values: ContentInput) => {
    setSaving(true);
    await apiClient.post("/content", values);
    await mutate();
    setSaving(false);
    reset({ status: "draft" });
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-600">
        Failed to load content. {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          CMS content
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Curate WorkFlicks landing pages, campaigns, and legal content.
        </p>
      </header>
      <section className="grid gap-6 xl:grid-cols-[3fr,2fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Published entries
          </h2>
          {isLoading && (
            <div className="mt-8 flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            </div>
          )}
          {!isLoading && data && (
            <ul className="mt-6 space-y-4">
              {data.content.map((item) => (
                <li
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400">{item.slug}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        item.status === "published"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                    {item.body}
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    Updated {new Date(item.updatedAt).toLocaleString()}
                  </p>
                </li>
              ))}
              {data.content.length === 0 && (
                <li className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-400">
                  No entries yet. Create the first block.
                </li>
              )}
            </ul>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create entry</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 flex flex-col gap-4"
          >
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Slug
              </span>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="e.g. landing-hero"
                {...register("slug")}
              />
              {errors.slug && (
                <span className="text-xs text-rose-500">
                  {errors.slug.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Title
              </span>
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
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
                Body
              </span>
              <textarea
                className="min-h-[180px] rounded-xl border border-slate-200 px-4 py-3 text-sm"
                {...register("body")}
              />
              {errors.body && (
                <span className="text-xs text-rose-500">
                  {errors.body.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Status
              </span>
              <select
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm capitalize"
                {...register("status")}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? "Publishing..." : "Publish entry"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
