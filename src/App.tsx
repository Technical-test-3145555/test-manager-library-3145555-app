import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from './auth/RequireRole';
import { Layout } from './components/Layout';
import { BooksPage } from './features/books/BooksPage';
import { LoansPage } from './features/loans/LoansPage';
import { NewLoanPage } from './features/loans/NewLoanPage';
import { LoginPage } from './features/login/LoginPage';
import { MembersPage } from './features/members/MembersPage';
import { OverduePage } from './features/overdue/OverduePage';
import { ReportPage } from './features/report/ReportPage';
import { UsersPage } from './features/users/UsersPage';

const STAFF = ['admin', 'librarian'] as const;

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/books" element={<RequireRole roles={[...STAFF]}><BooksPage /></RequireRole>} />
        <Route path="/members" element={<RequireRole roles={[...STAFF]}><MembersPage /></RequireRole>} />
        <Route path="/loans/new" element={<RequireRole roles={[...STAFF]}><NewLoanPage /></RequireRole>} />
        <Route path="/loans" element={<RequireRole roles={[...STAFF]}><LoansPage /></RequireRole>} />
        <Route path="/overdue" element={<RequireRole roles={[...STAFF]}><OverduePage /></RequireRole>} />
        <Route path="/report" element={<RequireRole roles={['admin']}><ReportPage /></RequireRole>} />
        <Route path="/users" element={<RequireRole roles={['admin']}><UsersPage /></RequireRole>} />
        <Route path="*" element={<Navigate to="/books" replace />} />
      </Route>
    </Routes>
  );
}
