# Mobile UI reference implementation

The mobile screens were updated from the 13 supplied reference images. Runtime values come from the existing API; reference amounts, dates, user names and receipt details are not hardcoded into the application.

| Reference | Implementation |
| --- | --- |
| 1, 13 | Shared mobile bottom navigation and MM top bar |
| 2 | Floating chat launcher |
| 3 | Reports |
| 4 | Categories |
| 5 | Recurring transactions |
| 6 | Transactions |
| 7 | Saving goals |
| 8 | Budgets |
| 9 | Monthly savings |
| 10 | Dashboard |
| 11 | Wallets |
| 12 | Receipt scanner and OCR result |

The shared presentation uses bundled Be Vietnam Pro fonts, mobile theme colors, SVG progress rings, category icon gradients, solid primary actions, and the spacing and navigation variants in the references. The font license is included in `apps/mobile/assets/fonts/OFL.txt`.

The categories grid retains three custom-category columns and two default-category columns at narrow widths. Large dashboard balances scale with the available width. The receipt scanner displays actual OCR fields and confidence, and sends recognized values to the existing transaction form.

## Verification

From the repository root:

```powershell
npm run typecheck --workspace=moneymate-mobile
npm run lint --workspace=moneymate-mobile
```

From `apps/mobile`:

```powershell
npx expo export --platform all --output-dir .tmp-design-export
```

Local browser screenshots are in `.tmp/mobile-ui-review`, at 390 px and 487 px. The local preview harness uses API fixtures and tests wallet visibility, category filtering, budget periods, recurring activation, insufficient funds for a goal, yearly reports, yearly savings navigation and receipt upload/OCR-to-transaction navigation. These checks do not write to the real backend.

Browser visual checks and successful native bundle export do not replace rendering verification on an Android or iOS device. Pixel equality on physical devices has not been certified.
