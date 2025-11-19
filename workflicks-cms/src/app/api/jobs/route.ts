import { NextResponse } from "next/server";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verify-request";
import { jobSchema } from "@/lib/validators";

export async function GET(request: Request) {
  await verifyRequest(request, ["manageJobs"]);

  const db = getAdminDb();
  const jobsSnapshot = await db
    .collection("jobs")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const companyIds = Array.from(
    new Set(jobsSnapshot.docs.map((doc) => doc.get("companyId")).filter(Boolean)),
  );

  const companiesMap: Record<string, string> = {};
  if (companyIds.length) {
    const chunks: string[][] = [];
    for (let i = 0; i < companyIds.length; i += 10) {
      chunks.push(companyIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const snapshot = await db
        .collection("companies")
        .where(FieldPath.documentId(), "in", chunk)
        .get();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        companiesMap[doc.id] = data.name ?? "Unknown";
      });
    }
  }

  const jobs = jobsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    };
  });

  return NextResponse.json({ jobs, companies: companiesMap });
}

export async function POST(request: Request) {
  const auth = await verifyRequest(request, ["manageJobs"]);
  const payload = await request.json();

  const schemaResult = jobSchema.safeParse({
    ...payload,
    skills: Array.isArray(payload.skills)
      ? payload.skills
      : String(payload.skills ?? "")
          .split(",")
          .map((skill: string) => skill.trim())
          .filter(Boolean),
    salaryMin:
      payload.salaryMin !== undefined
        ? Number.parseInt(payload.salaryMin, 10)
        : undefined,
    salaryMax:
      payload.salaryMax !== undefined
        ? Number.parseInt(payload.salaryMax, 10)
        : undefined,
  });

  if (!schemaResult.success) {
    return NextResponse.json(
      { message: "Invalid job payload.", issues: schemaResult.error.flatten() },
      { status: 422 },
    );
  }

  const jobData = schemaResult.data;
  const db = getAdminDb();
  const docRef = db.collection("jobs").doc();

  await docRef.set({
    ...jobData,
    postedBy: auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    type: "job.created",
    summary: `${auth.email ?? auth.uid} created job ${jobData.title}`,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: docRef.id });
}
