import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verify-request";

export async function GET(request: Request) {
  await verifyRequest(request, ["viewAnalytics"]);

  const db = getAdminDb();
  const [jobsSnapshot, companiesSnapshot, usersSnapshot] = await Promise.all([
    db.collection("jobs").count().get(),
    db.collection("companies").count().get(),
    db
      .collection("users")
      .where("role", "in", ["recruiter", "admin", "superAdmin"])
      .count()
      .get(),
  ]);

  const publishedJobsSnapshot = await db
    .collection("jobs")
    .where("status", "==", "published")
    .count()
    .get();

  const pipelineStatuses = await db
    .collection("jobs")
    .select("status")
    .get()
    .then((snapshot) => {
      const statusCounts: Record<string, number> = {};
      snapshot.docs.forEach((doc) => {
        const status = doc.get("status") ?? "draft";
        statusCounts[status] = (statusCounts[status] ?? 0) + 1;
      });
      return Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));
    });

  const recentActivitySnapshot = await db
    .collection("auditLogs")
    .orderBy("createdAt", "desc")
    .limit(5)
    .get();

  const recentActivity = recentActivitySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      type: data.type ?? "event",
      summary: data.summary ?? "Activity recorded",
      timestamp: (data.createdAt?.toDate?.() ?? new Date()).toISOString(),
    };
  });

  return NextResponse.json({
    totals: {
      jobs: jobsSnapshot.data().count,
      companies: companiesSnapshot.data().count,
      recruiters: usersSnapshot.data().count,
      publishedJobs: publishedJobsSnapshot.data().count,
    },
    pipeline: pipelineStatuses,
    recentActivity,
  });
}
