export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  _count: { transactions: number; wallets: number };
}

const avatarColors = ['bg-blue-500', 'bg-violet-600', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-indigo-950'];
export function avatarColor(id: string) {
  const hash = Array.from(id).reduce((value, character) => ((value * 31 + character.charCodeAt(0)) >>> 0), 0);
  return avatarColors[hash % avatarColors.length];
}

export function usersCsv(users: AdminUser[]) {
  const escapeCell = (value: string | number) => {
    const text = String(value);
    // Quoting alone does not prevent spreadsheet applications executing formulas.
    const safe = /^\s*[=+@-]|^[\t\r\n]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const rows = [
    ['ID', 'Họ và tên', 'Email', 'Vai trò', 'Giao dịch', 'Số ví', 'Ngày tạo'],
    ...users.map((user) => [user.id, user.fullName, user.email, user.role, user._count.transactions, user._count.wallets, user.createdAt]),
  ];
  return '\uFEFF' + rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function exportUsers(users: AdminUser[]) {
  const url = URL.createObjectURL(new Blob([usersCsv(users)], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `moneymate-users-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
