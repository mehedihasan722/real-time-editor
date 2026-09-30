import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return Response.json([], { status: 403 });
  const search = new URL(request.url).searchParams;
  const ids = search.getAll("id").slice(0, 100);
  try {
    const clerk = await clerkClient();
    const members = await clerk.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: ids.length ? 100 : 30, ...(ids.length ? { userId: ids } : { query: (search.get("q") ?? "").slice(0, 100) }) });
    return Response.json(members.data.flatMap(member => member.publicUserData ? [{ id: member.publicUserData.userId, name: [member.publicUserData.firstName, member.publicUserData.lastName].filter(Boolean).join(" ") || "Team member", avatar: member.publicUserData.imageUrl }] : []), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json([], { status: 503 });
  }
}
