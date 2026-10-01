# Browsing boards

Table and Grid views share a page size selector with 10, 15, 20, 25 and 50 boards per page. The footer displays the visible range and numbered pages, with first, previous, next and last controls. Last becomes available once all remaining records have loaded, so unknown totals are never presented as exact counts. Additional Convex cursor pages load on demand to fill the requested page. Filter and sort changes return to the first page; organization and search changes reset the browsing scope.

Board types use distinct accessible icons. Grid covers are generated vector illustrations specific to AI Playground, product requirements, weekly updates, roadmaps, retrospectives, tasks, flowcharts and prototypes. Variations derive deterministically from the board ID; a short ID label distinguishes duplicate names. Covers represent the type inferred from the current title, not a screenshot of live board contents. Generic boards receive a whiteboard preview. Existing board records do not need migration.

The compact table uses icon-labeled columns, member ownership, creation dates, favourite controls and board action menus. Both views follow Flowboard light/dark theme tokens.

Sorting and local table filters apply to loaded records. The interface marks partial totals with a plus sign and explains this scope while more records remain. Cursor pagination retains existing tenant authorization.
