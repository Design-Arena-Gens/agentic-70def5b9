import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verify-request";
import { ROLE_PERMISSIONS, isRole, type Permission } from "@/lib/auth/roles";
import { z } from "zod";

const payloadSchema = z.object({
  role: z.string(),
  permission: z.string(),
  enabled: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await verifyRequest(request, ["manageSettings"]);
  const payload = await request.json();
  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid payload." },
      { status: 422 },
    );
  }

  const { role, permission, enabled } = parsed.data;
  const shouldEnable = Boolean(enabled);

  if (!isRole(role)) {
    return NextResponse.json(
      { message: "Unknown role." },
      { status: 400 },
    );
  }

  const allPermissions = new Set<Permission>(
    Object.values(ROLE_PERMISSIONS).flat(),
  );
  if (!allPermissions.has(permission as Permission)) {
    return NextResponse.json(
      { message: "Unknown permission." },
      { status: 400 },
    );
  }

  if (role === "superAdmin") {
    return NextResponse.json(
      { message: "Super admin permissions cannot be modified." },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const configRef = db.collection("config").doc("rbac");
  const config = await configRef.get();
  const current = config.exists ? (config.data()?.roles ?? {}) : {};
  const existingPermissions = (current[role] ?? ROLE_PERMISSIONS[role]) as string[];

  const updatedPermissions = shouldEnable
    ? Array.from(new Set([...existingPermissions, permission]))
    : existingPermissions.filter((item) => item !== permission);

  await configRef.set(
    {
      roles: {
        ...current,
        [role]: updatedPermissions,
      },
    },
    { merge: true },
  );

  const usersSnapshot = await db
    .collection("users")
    .where("role", "==", role)
    .get();

  const batch = db.batch();
  usersSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      permissions: updatedPermissions,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  const adminAuth = getAdminAuth();
  await Promise.all(
    usersSnapshot.docs.map((doc) =>
      adminAuth.setCustomUserClaims(doc.id, {
        role,
        permissions: updatedPermissions,
      }),
    ),
  );

  await db.collection("auditLogs").add({
    type: "settings.permission",
    summary: `${auth.email ?? auth.uid} ${shouldEnable ? "granted" : "revoked"} ${permission} for ${role}`,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ role, permissions: updatedPermissions });
}
