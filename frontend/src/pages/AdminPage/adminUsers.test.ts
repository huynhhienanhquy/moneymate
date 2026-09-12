import { usersCsv, type AdminUser } from './adminUsers';

it('exports Unicode CSV with escaped quotes and inert spreadsheet formulas', () => {
  const user: AdminUser = { id: 'user-a', fullName: '=SUM(1,2)', email: 'name@example.com', role: 'USER', createdAt: '2026-08-01', _count: { transactions: 118, wallets: 2 } };
  const csv = usersCsv([user, { ...user, id: 'user-b', fullName: 'Hà "Quý"' }]);
  expect(csv.startsWith('\uFEFF')).toBe(true);
  expect(csv).toContain('"\'=SUM(1,2)"');
  expect(csv).toContain('"Hà ""Quý"""');
  expect(csv).toContain('"118","2"');
});
