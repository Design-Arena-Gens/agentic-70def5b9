export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-24">
        <div className="flex flex-col gap-8">
          <span className="w-fit rounded-full border border-white/20 bg-white/5 px-4 py-1 text-sm uppercase tracking-[0.3em] text-white/80">
            WorkFlicks CMS
          </span>
          <h1 className="text-4xl font-semibold sm:text-6xl">
            Operate the WorkFlicks.in job marketplace with precision and trust.
          </h1>
          <p className="max-w-2xl text-lg text-white/70">
            Manage jobs, recruiters, companies, and CMS content from a single,
            secure console backed by Firebase Authentication, Firestore, Cloud
            Functions, and Cloud Storage.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="/login"
              className="rounded-full bg-white px-6 py-3 text-center font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:bg-slate-100"
            >
              Access Console
            </a>
            <a
              href="#capabilities"
              className="rounded-full border border-white/40 px-6 py-3 text-center font-semibold text-white/80 transition hover:border-white hover:text-white"
            >
              Explore Capabilities
            </a>
          </div>
        </div>
        <section
          id="capabilities"
          className="mt-20 grid gap-8 md:grid-cols-3 md:gap-12"
        >
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-xl font-semibold text-white">Role Security</h2>
            <p className="mt-3 text-sm text-white/70">
              Enforce granular roles across super admins, admins, recruiters,
              and content teams with Firebase custom claims.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-xl font-semibold text-white">Realtime Data</h2>
            <p className="mt-3 text-sm text-white/70">
              Track hiring pipelines, content publishing, and user adoption with
              streaming updates from Cloud Firestore.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-xl font-semibold text-white">
              Automated Workflows
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Trigger Cloud Functions for sanitisation, notifications, and
              billing to keep operations resilient.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
