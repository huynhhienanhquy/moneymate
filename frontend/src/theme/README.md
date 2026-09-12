# Web theme

Edit `packages/design-tokens/src/web.ts` to change the web palette, typography,
shadows, layout dimensions and chart geometry. `frontend/tailwind.config.js`
extends Tailwind's built-in theme with these tokens. Rebuild the package after
editing it: `npm run build --workspace=@moneymate/design-tokens`.

The shared package emits CommonJS for Node and mobile consumers. Vite explicitly
pre-bundles it through `optimizeDeps.include` so browser modules can use named
imports such as `webTheme`. After rebuilding tokens during development, restart
Vite with `npm run dev --workspace=moneymate-frontend -- --force` and reload the
page to refresh the optimized dependency cache.

Use named utilities such as `bg-primary`, `shadow-summary`, `w-sidebar`,
`text-page-title`, `size-icon-nav` and `duration-normal`. Sidebar width and the
page's left margin intentionally use the same `sidebar` spacing token.

Use `bg-ui-surface`, `text-ui-text`, `text-ui-muted` and `border-ui-border` for
surfaces that follow the `.dark` class. Tailwind generates their CSS variables
from `webTheme.light` and `webTheme.dark`.

Recharts uses `chartTheme` from `charts.ts`, backed by those same CSS variables
and shared numeric geometry tokens. User-selected category colors remain data
and can override the chart palette. Keep actual hex values for color inputs and
API payloads; CSS variables are for presentation only.

Currency, translated text, API routes, pagination, validation and business rules
are not CSS theme tokens. React Native continues to use its own StyleSheet/theme
adapter; this web theme does not introduce NativeWind or change mobile styling.
