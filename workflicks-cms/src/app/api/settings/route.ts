import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verify-request";
import { ROLE_PERMISSIONS, type Role } from "@/lib/auth/roles";

export async function GET(request: Request) {
  await verifyRequest(request, ["manageSettings"]);

  const db = getAdminDb();
  const configDoc = await db.collection("config").doc("rbac").get();
  const configData = configDoc.exists ? (configDoc.data() ?? {}) : {};
  const storedRoles = (configData.roles ?? {}) as Record<Role, string[]>;

  const roles = (Object.keys(ROLE_PERMISSIONS) as Role[]).map((role) => ({
    role,
    permissions: storedRoles[role] ?? ROLE_PERMISSIONS[role],
  }));

  const auditSnapshot = await db
    .collection("auditLogs")
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  const auditLog = auditSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      actor: data.summary?.split(" ")[0] ?? "system",
      action: data.summary ?? "Updated settings",
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    };
  });

  return NextResponse.json({ roles, auditLog });
}
