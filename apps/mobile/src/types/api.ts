export interface Wallet { id: string; name: string; type: string; currency: string; initialBalance: string | number }
export interface Category { id: string; name: string; type: 'INCOME' | 'EXPENSE'; color: string; icon: string }
export interface Transaction { id: string; version: number; walletId?: string; categoryId?: string; amount: string | number; type: 'INCOME' | 'EXPENSE' | 'TRANSFER'; note?: string; transactionDate: string; wallet?: { id?: string; name: string }; category?: { id?: string; name: string; color: string } }
export interface Dashboard { netWorth: number; monthlyIncome: number; monthlyExpense: number; monthlySavings: number; recentTransactions: Transaction[] }
export interface Budget { id: string; amount: string | number; spent?: number; percentage?: number; category?: Category }
