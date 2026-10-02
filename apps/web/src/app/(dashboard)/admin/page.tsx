import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboard from "./admin-dashboard";
import { canAdminister, workspaceRole } from "@/lib/roles";
export default async function AdminPage() {
  const { orgId, orgRole } = await auth();
  if (!orgId || !canAdminister(workspaceRole(orgRole))) redirect("/");
  return <AdminDashboard orgId={orgId} />;
}
