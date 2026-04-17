export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id?: string;
  uid: string;
  amount: number;
  category: string;
  date: Date;
  notes: string;
  type: TransactionType;
  createdAt: Date;
}
