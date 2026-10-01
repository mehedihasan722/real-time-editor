export type WorkspaceRole = "owner" | "admin" | "member" | "guest";
export function workspaceRole(value: unknown): WorkspaceRole {
  const role = typeof value === "string" ? value.replace(/^org:/, "") : "";
  if (role === "owner" || role === "admin" || role === "adm") return role === "owner" ? "owner" : "admin";
  if (role === "member" || role === "mem") return "member";
  return "guest";
}
export function identityRole(identity: Record<string, unknown>): WorkspaceRole {
  const org = identity.o;
  return workspaceRole(identity.org_role ?? identity.orgRole ?? (org && typeof org === "object" ? (org as Record<string, unknown>).rol : undefined));
}
export const canEdit = (role: WorkspaceRole) => role !== "guest";
export const canAdminister = (role: WorkspaceRole) => role === "owner" || role === "admin";
export function assertEditor(identity: Record<string, unknown>) {
  if (!canEdit(identityRole(identity))) throw new Error("An organization member role is required.");
}
