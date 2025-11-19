import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verify-request";
import { companySchema } from "@/lib/validators";

export async function GET(request: Request) {
  await verifyRequest(request, ["manageCompanies"]);

  const db = getAdminDb();
  const snapshot = await db
    .collection("companies")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const companies = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    };
  });

  return NextResponse.json({ companies });
}

export async function POST(request: Request) {
  const auth = await verifyRequest(request, ["manageCompanies"]);
  const payload = await request.json();
  const parse = companySchema.safeParse(payload);

  if (!parse.success) {
    return NextResponse.json(
      { message: "Invalid company payload.", issues: parse.error.flatten() },
      { status: 422 },
    );
  }

  const db = getAdminDb();
  const docRef = db.collection("companies").doc();
  await docRef.set({
    ...parse.data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    type: "company.created",
    summary: `${auth.email ?? auth.uid} created company ${parse.data.name}`,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: docRef.id });
}
