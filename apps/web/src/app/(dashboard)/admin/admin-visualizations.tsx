"use client";

import { useEffect, useState } from "react";
import { useClerk, useOrganization, useUser } from "@clerk/nextjs";
import { Globe2, ShieldCheck } from "lucide-react";
import ConfirmModal from "@/components/confirm-modal";
import { toast } from "sonner";

export function AdminMembers() {
  const clerk = useClerk();
  const { user } = useUser();
  const { organization, memberships } = useOrganization({ memberships: { pageSize: 10, keepPreviousData: true } });
  const [roles, setRoles] = useState<{ key: string; name: string }[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setRoles([]);
    setDrafts({});
    if (organization) void organization.getRoles({ pageSize: 100 }).then(result => {
      if (active) setRoles(result.data.filter(role => ["org:admin", "org:member", "org:guest"].includes(role.key)).map(role => ({ key: role.key, name: role.name })));
    }).catch(() => { if (active) toast.error("Could not load available roles. Open Manage access to retry."); });
    return () => { active = false; };
  }, [organization]);
  return <section className="ai-panel ai-members"><div className="ai-panel-header"><div><h2>Members & access</h2><p>Manage roles, invitations and workspace membership</p></div><button className="ai-control" onClick={() => clerk.openOrganizationProfile()}><ShieldCheck size={15} /> Manage access</button></div>
    {memberships?.error ? <p className="ai-empty" role="alert">Could not load members. Use Manage access to open organization settings.</p> : <div className="ai-table-scroll"><table><thead><tr><th>Member</th><th>Role</th><th>Controls</th></tr></thead><tbody>{memberships?.data?.map(member => {
      const name = [member.publicUserData?.firstName, member.publicUserData?.lastName].filter(Boolean).join(" ") || member.publicUserData?.identifier || "Workspace member";
      const locked = member.publicUserData?.userId === user?.id || member.role === "org:owner";
      const draft = drafts[member.id] ?? member.role;
      const mutate = async (action: "role" | "remove") => {
        if (busy || locked) return;
        setBusy(member.id);
        try {
          if (action === "role") await member.update({ role: draft }); else await member.destroy();
          toast.success(action === "role" ? "Member role updated" : "Member removed from workspace");
          await memberships?.revalidate?.();
        } catch { toast.error("Change failed. Check your organization permissions and try again."); }
        finally { setBusy(null); }
      };
      return <tr key={member.id}><td><strong>{name}</strong><small>{member.publicUserData?.identifier}</small></td><td><select className="ai-control" aria-label={`Role for ${name}`} value={draft} disabled={locked || busy !== null || !roles.length} onChange={event => setDrafts(current => ({ ...current, [member.id]: event.target.value }))}>{!roles.some(role => role.key === member.role) && <option value={member.role}>{member.roleName || member.role.replace(/^org:/, "")}</option>}{roles.map(role => <option key={role.key} value={role.key}>{role.name}</option>)}</select></td><td><div className="ai-board-actions"><ConfirmModal header={`Change ${name}’s role?`} description={`Assign ${draft.replace(/^org:/, "")} access to this workspace.`} disabled={busy !== null} onConfirm={() => void mutate("role")}><button className="ai-control" disabled={locked || busy !== null || draft === member.role || !roles.some(role => role.key === draft)}>Save role</button></ConfirmModal><ConfirmModal header={`Remove ${name}?`} description="Remove this member’s access to the organization. Their account and existing boards will remain." disabled={busy !== null} onConfirm={() => void mutate("remove")}><button className="ai-delete" disabled={locked || busy !== null}>{busy === member.id ? "Updating…" : "Remove"}</button></ConfirmModal></div></td></tr>;
    })}</tbody></table></div>}
    <div className="ai-member-footer"><span>{memberships?.isLoading ? "Loading members…" : `${memberships?.count ?? 0} workspace members`}</span><button className="ai-control" disabled={!memberships?.hasPreviousPage || memberships.isFetching} onClick={() => memberships?.fetchPrevious?.()}>Previous</button><button className="ai-control" disabled={!memberships?.hasNextPage || memberships.isFetching} onClick={() => memberships?.fetchNext?.()}>Next</button></div>
    <p className="ai-note">Role changes and member removal are authorized by Clerk. Your own role and Owner memberships are protected here. Available roles depend on your organization configuration.</p>
  </section>;
}

export function OwnershipChart({ owners, loading }: { owners: { name: string; count: number }[]; loading: boolean }) {
  const total = owners.reduce((sum, owner) => sum + owner.count, 0);
  const colors = ["#f97316", "#eab308", "#22c55e", "#38bdf8", "#a78bfa", "#fb7185"];
  const slices = owners.slice(0, 5);
  if (owners.length > 5) slices.push({ name: "Other creators", count: owners.slice(5).reduce((sum, owner) => sum + owner.count, 0) });
  return <section className="ai-panel"><div className="ai-panel-header"><div><h2>Board ownership</h2><p>Share of loaded boards by creator</p></div></div><div className="ai-distribution"><svg viewBox="0 0 200 200" role="img" aria-label={loading ? "Loading board ownership" : `Board ownership: ${slices.map(slice => `${slice.name}, ${slice.count}`).join("; ") || "No boards"}`}><circle cx="100" cy="100" r="72" fill="none" stroke="currentColor" opacity=".15" strokeWidth="28" />{slices.map((slice, index) => { const fraction = slice.count / Math.max(1, total); const start = slices.slice(0, index).reduce((sum, item) => sum + item.count, 0) / Math.max(1, total); return <circle key={index} cx="100" cy="100" r="72" pathLength="1" fill="none" stroke={colors[index]} strokeWidth="28" strokeDasharray={`${fraction} ${1 - fraction}`} strokeDashoffset={-start} transform="rotate(-90 100 100)" />; })}<text x="100" y="100" textAnchor="middle" fill="currentColor" fontSize="32">{loading ? "—" : total}</text><text x="100" y="123" textAnchor="middle" fill="currentColor" fontSize="11">boards</text></svg><ul>{slices.map((slice, index) => <li key={index}><i style={{ background: colors[index] }} /><span>{slice.name}</span><strong>{Math.round(slice.count / Math.max(1, total) * 100)}%</strong></li>)}{!total && <li>{loading ? "Loading…" : "Create a board to see the distribution."}</li>}</ul></div></section>;
}

export function WorkspaceWorld() {
  const [paths, setPaths] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/maps/world.json", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Map unavailable");
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("paths" in data) || !Array.isArray(data.paths) || !data.paths.every(path => typeof path === "string")) throw new Error("Invalid map");
      setPaths(data.paths);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  return <section className="ai-panel ai-world"><div className="ai-panel-header"><div><h2>Global workspace</h2><p>A shared space, wherever your team works</p></div><Globe2 size={18} /></div><div className="ai-world-canvas"><svg viewBox="0 0 720 360" role="img" aria-label="World map. Member locations are not collected."><defs><radialGradient id="workspace-map-glow"><stop stopColor="#ff6a18" stopOpacity=".2" /><stop offset="1" stopColor="#ff6a18" stopOpacity="0" /></radialGradient></defs><rect width="720" height="360" fill="url(#workspace-map-glow)" />{Array.from({ length: 11 }, (_, index) => <path key={index} d={`M${index * 72},0V360`} className="ai-map-grid" />)}{[90, 180, 270].map(y => <path key={y} d={`M0,${y}H720`} className="ai-map-grid" />)}{paths.map((path, index) => <path key={index} d={path} className="ai-map-land" />)}</svg>{failed && <p className="ai-note" role="alert">World map could not load.</p>}</div><p className="ai-note">Location analytics are unavailable: Flowboard does not collect member geolocation. This map is a geographic overview, with no simulated activity.</p><a className="ai-map-credit" href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Map data: Natural Earth</a></section>;
}
