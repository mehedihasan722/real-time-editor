# Admin dashboard and access

The `/admin` route is restricted to active Clerk organization owners and admins. Boards remain authorized and isolated by Convex organization checks.

The dashboard follows a charcoal and warm orange style with native light mode, creation history, an ownership donut chart, contributors, a world outline and recent board creations. Reports and charts cover loaded board pages; load remaining pages for a complete report. Counts are not session analytics. Geographic member data is not collected, so the world outline has no activity hotspots.

Board rows expose a visible Delete action with a permanent-deletion confirmation. The existing Convex deletion mutation removes the board and schedules collaboration storage cleanup.

Members are paginated through Clerk. A role selector exposes configured Admin, Member and Guest roles. Save role and Remove each require confirmation, handle failures and revalidate membership data. Self membership changes and Owner membership changes are disabled in these controls. Clerk Frontend API validates permissions and organization membership; there is no privileged backend credential in the browser. Manage access opens Clerk organization settings for invitations and advanced membership administration. Removing a membership does not delete an account or its boards. JWT consumers may require session refresh after role changes.

The help guide explains both canvas workspaces, keyboard shortcuts, roles, provider requirements, report scope and offline limits.

Map geometry derives from Natural Earth 1:110m countries, public domain: https://www.naturalearthdata.com/about/terms-of-use/
