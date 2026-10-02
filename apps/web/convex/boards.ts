import { v } from "convex/values";
import { query } from "./_generated/server";
import { getActiveOrganizationId } from "../src/lib/organization-claim";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { boardWithFavourite } from "./boardValidators";
import { canAdminister, identityRole } from "../src/lib/roles";

export const adminList = query({
  args: { orgId: v.string(), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(boardWithFavourite),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || getActiveOrganizationId(identity) !== args.orgId || !canAdminister(identityRole(identity))) throw new Error("Administrator access required");
    const result = await ctx.db.query("boards").withIndex("by_org", q => q.eq("orgId", args.orgId)).order("desc").paginate({ ...args.paginationOpts, numItems: Math.min(100, Math.max(1, args.paginationOpts.numItems)) });
    const page = await Promise.all(result.page.map(async board => {
      const favourite = await ctx.db.query("userFavourites").withIndex("by_user_board_org", q => q.eq("userId", identity.subject).eq("boardId", board._id).eq("orgId", args.orgId)).unique();
      return { ...board, isFavourite: Boolean(favourite) };
    }));
    return { ...result, page };
  },
});

export const get = query({
  args: {
    orgId: v.string(),
    search: v.optional(v.string()),
    favourites: v.optional(v.string()),
  },
  returns: v.array(boardWithFavourite),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }
    const activeOrgId = getActiveOrganizationId(identity);
    if (activeOrgId !== args.orgId) {
      throw new Error("Organization access denied");
    }

    if (args.favourites) {
      const favouritedBoards = await ctx.db
        .query("userFavourites")
        .withIndex("by_user_org", (q) =>
          q.eq("userId", identity.subject).eq("orgId", args.orgId)
        )
        .order("desc")
        .take(100);

      const ids = favouritedBoards.map((b) => b.boardId);

      const boards = await Promise.all(ids.map((id) => ctx.db.get(id)));

      return boards
        .filter((board): board is NonNullable<typeof board> =>
          board !== null && board.orgId === args.orgId
        )
        .map((board) => ({ ...board, isFavourite: true }));
    }

    const title = args.search as string;

    let boards = [];

    if (title) {
      boards = await ctx.db
        .query("boards")
        .withSearchIndex("search_title", (q) =>
          q.search("title", title).eq("orgId", args.orgId)
        )
        .take(100);
    } else {
      boards = await ctx.db
        .query("boards")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .order("desc")
        .take(100);
    }

    const boardsWithFavouriteRelation = boards.map((board) => {
      return ctx.db
        .query("userFavourites")
        .withIndex("by_user_board", (q) =>
          q.eq("userId", identity.subject).eq("boardId", board._id)
        )
        .unique()
        .then((favourite) => {
          return { ...board, isFavourite: !!favourite };
        });
    });

    const boardsWithFavouriteBoolean = Promise.all(boardsWithFavouriteRelation);

    return boardsWithFavouriteBoolean;
  },
});

export const list = query({
  args: {
    orgId: v.string(),
    search: v.optional(v.string()),
    favourites: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(boardWithFavourite),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || getActiveOrganizationId(identity) !== args.orgId) {
      throw new Error("Organization access denied");
    }
    const options = { ...args.paginationOpts, numItems: Math.min(100, Math.max(1, args.paginationOpts.numItems)) };
    if (args.favourites) {
      const result = await ctx.db.query("userFavourites")
        .withIndex("by_user_org", q => q.eq("userId", identity.subject).eq("orgId", args.orgId))
        .order("desc").paginate(options);
      const boards = await Promise.all(result.page.map(favourite => ctx.db.get(favourite.boardId)));
      return { ...result, page: boards
        .filter((board): board is NonNullable<typeof board> => board !== null && board.orgId === args.orgId)
        .filter(board => !args.search || board.title.toLowerCase().includes(args.search.toLowerCase()))
        .map(board => ({ ...board, isFavourite: true })) };
    }
    const result = args.search
      ? await ctx.db.query("boards").withSearchIndex("search_title", q => q.search("title", args.search!).eq("orgId", args.orgId)).paginate(options)
      : await ctx.db.query("boards").withIndex("by_org", q => q.eq("orgId", args.orgId)).order("desc").paginate(options);
    const page = await Promise.all(result.page.map(async board => {
      const favourite = await ctx.db.query("userFavourites")
        .withIndex("by_user_board", q => q.eq("userId", identity.subject).eq("boardId", board._id)).unique();
      return { ...board, isFavourite: Boolean(favourite) };
    }));
    return { ...result, page };
  },
});
