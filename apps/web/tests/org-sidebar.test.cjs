const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

test("sidebar selects the current route rather than always selecting Team boards", () => {
  let pathname = "/", query = "";
  const exported = {};
  const mocks = {
    "next/navigation": { usePathname: () => pathname, useSearchParams: () => new URLSearchParams(query) },
    "@clerk/nextjs": { OrganizationSwitcher: () => null, useAuth: () => ({ orgRole: "org:admin" }) },
    "@/components/ui/button": { Button: ({ children, variant }) => React.cloneElement(children, { "data-variant": variant }) },
    "@/lib/utils": { cn: (...values) => values.join(" ") },
    "@/lib/roles": { canAdminister: () => true, workspaceRole: value => value },
    "next/link": { __esModule: true, default: ({ href, children, ...props }) => React.createElement("a", { ...props, href: typeof href === "string" ? href : "/?favourites=true" }, children) },
    "next/image": { __esModule: true, default: () => null },
    "lucide-react": new Proxy({}, { get: () => () => null }),
  };
  const source = fs.readFileSync(path.join(__dirname, "../src/app/(dashboard)/_components/org-sidebar.tsx"), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports: exported, require: name => mocks[name] || require(name) });
  for (const [route, search, expected] of [["/", "", "Team boards"], ["/", "favourites=true", "Favourite boards"], ["/templates", "", "Templates"], ["/games", "", "Games"], ["/guide", "", "Guide"], ["/settings", "", "Settings"], ["/settings/profile", "", "Settings"], ["/admin", "", "Admin dashboard"], ["/guide", "favourites=true", "Guide"]]) {
    pathname = route; query = search;
    const html = renderToStaticMarkup(React.createElement(exported.OrgSidebar));
    const active = html.match(/<a[^>]*aria-current="page"[^>]*>.*?<\/a>/g) || [];
    assert.equal(active.length, 1, `${route}?${search}`);
    assert.ok(active[0].includes(expected), `${route} selects ${expected}`);
    assert.match(active[0], /data-variant="secondary"/);
  }
  pathname = "/unknown"; query = "";
  assert.ok(!renderToStaticMarkup(React.createElement(exported.OrgSidebar)).includes('aria-current="page"'));
});
