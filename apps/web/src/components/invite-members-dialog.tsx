"use client";

import { useMemo, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { Building2, Link2, Loader2, Mail, Send, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InviteMembersDialogProps {
  children: React.ReactNode;
}

const parseEmails = (value: string) =>
  Array.from(new Set(value.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean)));

export const InviteMembersDialog = ({ children }: InviteMembersDialogProps) => {
  const { organization } = useOrganization();
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<"org:member" | "org:admin">("org:member");
  const [pending, setPending] = useState(false);
  const parsedEmails = useMemo(() => parseEmails(emails), [emails]);
  const validEmails = parsedEmails.filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  const inviteUrl = typeof window === "undefined" ? "" : window.location.href;
  const message = `Join ${organization?.name || "our Flowboard workspace"}: ${inviteUrl}`;

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied", { description: "Share it with teammates to open this workspace." });
  };

  const openMailProvider = (provider: "google" | "microsoft") => {
    const subject = encodeURIComponent(`Join ${organization?.name || "my Flowboard workspace"}`);
    const body = encodeURIComponent(message);
    const url = provider === "google"
      ? `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`
      : `https://outlook.office.com/mail/deeplink/compose?subject=${subject}&body=${body}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareToSlack = async () => {
    await navigator.clipboard.writeText(message);
    toast.success("Slack invitation copied", { description: "Paste it into the teammate or channel you want to invite." });
  };

  const sendInvitations = async () => {
    if (!organization || !validEmails.length || validEmails.length !== parsedEmails.length) {
      toast.error("Enter valid email addresses");
      return;
    }

    setPending(true);
    const results = await Promise.allSettled(
      validEmails.map((emailAddress) => organization.inviteMember({ emailAddress, role })),
    );
    const sent = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - sent;
    setPending(false);

    if (sent) {
      toast.success(`${sent} invitation${sent === 1 ? "" : "s"} sent`, {
        description: failed ? `${failed} invitation${failed === 1 ? "" : "s"} could not be sent.` : `Invited as ${role === "org:admin" ? "admins" : "members"}.`,
      });
      setEmails("");
    } else {
      toast.error("Invitations could not be sent", { description: "Check your organization role and try again." });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[640px] overflow-hidden border-0 p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-200 px-8 py-6 pr-14">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Users className="size-5" /></span>
            Invite to {organization?.name || "Flowboard"}
          </DialogTitle>
          <DialogDescription>Invite teammates by email or share a workspace link.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 border-b border-slate-200 px-8 pt-2 text-sm font-semibold text-slate-600">
          <button type="button" className="flex items-center justify-center gap-2 border-b-2 border-indigo-600 px-2 py-4 text-slate-950"><Mail className="size-4" /> Manual</button>
          <button type="button" onClick={() => openMailProvider("microsoft")} className="px-2 py-4 hover:text-indigo-600"><span className="mr-2 text-[#00a4ef]">■</span>Microsoft</button>
          <button type="button" onClick={() => openMailProvider("google")} className="px-2 py-4 hover:text-indigo-600"><span className="mr-2 font-bold text-[#4285f4]">G</span>Google</button>
          <button type="button" onClick={shareToSlack} className="px-2 py-4 hover:text-indigo-600"><span className="mr-2 text-[#36c5f0]">✣</span>Slack</button>
        </div>

        <div className="space-y-5 px-8 py-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Email addresses</span>
            <textarea
              value={emails}
              onChange={(event) => setEmails(event.target.value)}
              placeholder="Enter or paste email addresses, separated by commas"
              className="min-h-36 w-full resize-y rounded-xl border-2 border-slate-200 bg-white p-4 text-sm text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <Building2 className="size-4" /> Role
              <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-800">
                <option value="org:member">Member</option>
                <option value="org:admin">Admin</option>
              </select>
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={copyInviteLink} className="inline-flex h-11 items-center gap-2 rounded-lg border border-indigo-500 px-4 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"><Link2 className="size-4" /> Copy invite link</button>
              <button type="button" disabled={pending || !validEmails.length || validEmails.length !== parsedEmails.length} onClick={sendInvitations} className="inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send invitations
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
            Invitations are managed by your Clerk organization. Only organization admins can invite new members.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
