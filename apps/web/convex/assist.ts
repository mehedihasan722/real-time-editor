import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getActiveOrganizationId } from "../src/lib/organization-claim";
import { assertEditor } from "../src/lib/roles";
export const reserveRequest = mutation({
  args: { boardId: v.id("boards") }, returns: v.boolean(),
  handler: async (ctx, { boardId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    assertEditor(identity);
    const orgId = getActiveOrganizationId(identity), board = await ctx.db.get(boardId);
    if (!orgId || board?.orgId !== orgId) throw new Error("Board access denied");
    const window = Math.floor(Date.now() / 60000);
    const quota = await ctx.db.query("assistQuota").withIndex("by_org_user", q => q.eq("orgId", orgId).eq("userId", identity.subject)).unique();
    if (quota?.window === window && quota.count >= 12) return false;
    if (quota) await ctx.db.patch(quota._id, { window, count: quota.window === window ? quota.count + 1 : 1 });
    else await ctx.db.insert("assistQuota", { orgId, userId: identity.subject, window, count: 1 });
    return true;
  },
});
