import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verify-request";
import { z } from "zod";

const contentSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  body: z.string().min(10),
  status: z.enum(["draft", "published"]),
});

export async function GET(request: Request) {
  await verifyRequest(request, ["manageContent"]);

  const db = getAdminDb();
  const snapshot = await db
    .collection("cmsContent")
    .orderBy("updatedAt", "desc")
    .limit(50)
    .get();

  const content = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      slug: data.slug,
      title: data.title,
      body: data.body,
      status: data.status,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    };
  });

  return NextResponse.json({ content });
}

export async function POST(request: Request) {
  const auth = await verifyRequest(request, ["manageContent"]);
  const payload = await request.json();
  const parse = contentSchema.safeParse(payload);

  if (!parse.success) {
    return NextResponse.json(
      { message: "Invalid content payload.", issues: parse.error.flatten() },
      { status: 422 },
    );
  }

  const { slug, title, body, status } = parse.data;
  const db = getAdminDb();
  const docRef = db.collection("cmsContent").doc(slug);

  await docRef.set({
    slug,
    title,
    body,
    status,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    type: "content.updated",
    summary: `${auth.email ?? auth.uid} updated ${slug}`,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ slug });
}
