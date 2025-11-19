"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api/client";
import { ROLE_PERMISSIONS, type Role } from "@/lib/auth/roles";

type SettingsResponse = {
  roles: Array<{
    role: Role;
    permissions: string[];
  }>;
  auditLog: Array<{
    id: string;
    actor: string;
    action: string;
    createdAt: string;
  }>;
};

const fetchSettings = () => apiClient.get<SettingsResponse>("/settings");
const permissionList = Array.from(
  new Set(Object.values(ROLE_PERMISSIONS).flat()),
);

export default function SettingsPage() {
  const { data, mutate, isLoading, error } = useSWR(
    "settings",
    fetchSettings,
  );
  const [pendingRoleUpdate, setPendingRoleUpdate] = useState<string | null>(
    null,
  );

  const handlePermissionToggle = async (
    role: Role,
    permission: string,
    enabled: boolean,
  ) => {
    setPendingRoleUpdate(`${role}-${permission}`);
    await apiClient.post("/settings/permissions", {
      role,
      permission,
      enabled,
    });
    await mutate();
    setPendingRoleUpdate(null);
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-600">
        Failed to load settings. {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Control role permissions, audit actions, and platform toggles.
        </p>
      </header>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Role permissions matrix
        </h2>
        {isLoading && (
          <div className="mt-6 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          </div>
        )}
        {!isLoading && data && (
          <div className="mt-6 overflow-auto">
            <table className="min-w-full table-fixed border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Role
                  </th>
                  {permissionList.map((permission) => (
                    <th
                      key={permission}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                    >
                      {permission}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.roles.map((roleRow) => (
                  <tr key={roleRow.role} className="border-t border-slate-200">
                    <td className="sticky left-0 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {roleRow.role}
                    </td>
                    {permissionList.map((permission) => {
                      const checked = roleRow.permissions.includes(permission);
                      return (
                        <td key={permission} className="px-4 py-3">
                          <label className="flex items-center gap-2 text-xs text-slate-500">
                            <input
                              type="checkbox"
                              defaultChecked={checked}
                              disabled={roleRow.role === "superAdmin"}
                              onChange={(event) =>
                                handlePermissionToggle(
                                  roleRow.role,
                                  permission,
                                  event.target.checked,
                                )
                              }
                            />
                            <span className="capitalize">{permission}</span>
                            {pendingRoleUpdate ===
                              `${roleRow.role}-${permission}` && (
                              <span className="text-xs text-slate-400">
                                Saving...
                              </span>
                            )}
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Audit trail</h2>
        {!isLoading && data && (
          <ul className="mt-4 space-y-3 text-sm">
            {data.auditLog.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{entry.action}</p>
                  <p className="text-xs text-slate-400">
                    Actor: {entry.actor}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
            {data.auditLog.length === 0 && (
              <li className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
                No configuration changes recorded yet.
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
