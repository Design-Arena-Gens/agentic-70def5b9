import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verify-request";
import { ROLE_PERMISSIONS } from "@/lib/auth/roles";
import { userSchema } from "@/lib/validators";

export async function GET(request: Request) {
  await verifyRequest(request, ["manageAdmins"]);

  const db = getAdminDb();
  const [usersSnapshot, companiesSnapshot] = await Promise.all([
    db.collection("users").orderBy("createdAt", "desc").limit(100).get(),
    db.collection("companies").orderBy("name", "asc").limit(100).get(),
  ]);

  const users = usersSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    };
  });

  const companies = companiesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name ?? "Unknown",
    };
  });

  return NextResponse.json({ users, companies });
}

export async function POST(request: Request) {
  const auth = await verifyRequest(request, ["manageAdmins"]);
  const payload = await request.json();
  const parse = userSchema.safeParse(payload);

  if (!parse.success) {
    return NextResponse.json(
      { message: "Invalid user payload.", issues: parse.error.flatten() },
      { status: 422 },
    );
  }

  const { email, displayName, role, companyId } = parse.data;
  const permissions = ROLE_PERMISSIONS[role];

  const adminAuth = getAdminAuth();
  const db = getAdminDb();

  const existingUser = await adminAuth
    .getUserByEmail(email)
    .catch(() => null);

  let uid: string;

  if (existingUser) {
    uid = existingUser.uid;
    await adminAuth.updateUser(uid, { displayName });
  } else {
    const password = randomBytes(12).toString("base64");
    const created = await adminAuth.createUser({
      email,
      displayName,
      password,
    });
    uid = created.uid;
  }

  await adminAuth.setCustomUserClaims(uid, {
    role,
    permissions,
  });

  await db.collection("users").doc(uid).set(
    {
      email,
      displayName,
      role,
      companyId: companyId || null,
      permissions,
      disabled: false,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await db.collection("auditLogs").add({
    type: "user.invited",
    summary: `${auth.email ?? auth.uid} invited ${email} as ${role}`,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ uid });
}
