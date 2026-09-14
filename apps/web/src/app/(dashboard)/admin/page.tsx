import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboard from "./admin-dashboard";
export default function AdminPage() {
  const { orgId, orgRole } = auth();
  if (!orgId || orgRole !== "org:admin") redirect("/");
  return <AdminDashboard orgId={orgId} />;
}
