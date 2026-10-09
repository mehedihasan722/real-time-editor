const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

test('rejected backend authentication never mounts protected queries or modals', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/providers/convex-client-provider.tsx'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  for (const state of ['authenticated', 'unauthenticated', 'loading']) {
    for (const pathname of ['/', '/board/example', '/admin', '/sign-in', '/sign-up/verify']) {
      let mounted = 0, modals = 0;
      const mocks = {
        '@clerk/nextjs': { ClerkProvider: ({ children }) => children, useAuth: () => ({}) },
        'convex/react-clerk': { ConvexProviderWithClerk: ({ children }) => children },
        'convex/react': {
          ConvexReactClient: class {},
          Authenticated: ({ children }) => state === 'authenticated' ? children : null,
          Unauthenticated: ({ children }) => state === 'unauthenticated' ? children : null,
          AuthLoading: ({ children }) => state === 'loading' ? children : null,
        },
        '@/components/auth/loading': { __esModule: true, default: () => 'Loading workspace' },
        '@/providers/modal-provider': { __esModule: true, default: () => { modals++; return null; } },
        '@/lib/public-env': { publicEnv: { success: true, data: { NEXT_PUBLIC_CONVEX_URL: 'https://example.convex.cloud', NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_example' } }, setupMessage: 'Setup required' },
        'next-themes': { useTheme: () => ({ resolvedTheme: 'light' }) },
        'next/navigation': { usePathname: () => pathname },
      };
      const exported = {};
      vm.runInNewContext(code, { exports: exported, require: name => mocks[name] || require(name) });
      const child = React.createElement(() => { mounted++; return 'Route content'; });
      const html = renderToStaticMarkup(React.createElement(exported.ConvexClientProvider, { authConfigured: true }, child));
      const allowed = state === 'authenticated' || (state === 'unauthenticated' && pathname.startsWith('/sign-'));
      assert.equal(mounted, allowed ? 1 : 0, `${state}: ${pathname}`);
      assert.equal(modals, state === 'authenticated' ? 1 : 0);
      if (state === 'unauthenticated' && !allowed) assert.match(html, /Workspace connection unavailable/);
      if (state === 'loading') assert.match(html, /Loading workspace/);
    }
  }
});
