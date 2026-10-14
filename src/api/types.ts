/** Shapes of api-contract.md. Field names are the contract's snake_case on purpose. */

export type Role = 'admin' | 'librarian';

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: Category;
  total_copies: number;
  available_copies: number;
  cover_key: string | null;
}

export interface Member {
  id: string;
  full_name: string;
  document_number: string;
  active_loans?: number;
}

export interface LoanItem {
  id: string;
  book_id: string;
  book_title: string;
  isbn: string;
  category_name: string;
  due_at: string;
  returned_at: string | null;
}

export type LoanStatus = 'open' | 'overdue' | 'closed';

export interface Loan {
  id: string;
  member_id: string;
  loaned_at: string;
  status: LoanStatus;
  items: LoanItem[];
}

export interface OverdueLine {
  loan_id: string;
  item_id: string;
  book_title: string;
  member_name: string;
  due_at: string;
  days_late: number;
}

export interface ReportRow {
  book_id: string;
  book_title: string;
  category_name: string;
  times_borrowed: number;
}

export interface MostBorrowedReport {
  from: string;
  to: string;
  rows: ReportRow[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  role: Role;
}
