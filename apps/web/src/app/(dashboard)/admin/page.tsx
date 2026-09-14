import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboard from "./admin-dashboard";
export default async function AdminPage() {
  const { orgId, orgRole } = await auth();
  if (!orgId || orgRole !== "org:admin") redirect("/");
  return <AdminDashboard orgId={orgId} />;
}
