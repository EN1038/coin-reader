import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { SeriesPage } from './pages/SeriesPage';
import { ReadNovelPage } from './pages/ReadNovelPage';
import { ReadMangaPage } from './pages/ReadMangaPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { TopupPage } from './pages/TopupPage';
import { PayResultPage } from './pages/PayResultPage';
import { WalletPage } from './pages/WalletPage';
import { LibraryPage } from './pages/LibraryPage';
import { HistoryPage } from './pages/HistoryPage';
import { MePage } from './pages/MePage';
import { LegalTosPage } from './pages/LegalTosPage';
import { LegalPrivacyPage } from './pages/LegalPrivacyPage';
import { LegalCoinsPage } from './pages/LegalCoinsPage';
import { LegalTakedownPage } from './pages/LegalTakedownPage';
import { HelpPage } from './pages/HelpPage';
import { ReportPage } from './pages/ReportPage';
import { SettingsPage } from './pages/SettingsPage';
import { DeleteAccountPage } from './pages/DeleteAccountPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AuthorPage } from './pages/AuthorPage';
import { WriterLayout } from './pages/writer/WriterLayout';
import { WriterDashboard } from './pages/writer/WriterDashboard';
import { WriterWorksPage } from './pages/writer/WriterWorksPage';
import { WriterWorkForm } from './pages/writer/WriterWorkForm';
import { WriterChapterForm } from './pages/writer/WriterChapterForm';
import { WriterPayoutPage } from './pages/writer/WriterPayoutPage';
import { WriterRegisterPage } from './pages/writer/WriterRegisterPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAuthorsPage } from './pages/admin/AdminAuthorsPage';
import { AdminWorksPage } from './pages/admin/AdminWorksPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminTakedownsPage } from './pages/admin/AdminTakedownsPage';
import { AdminLedgerPage } from './pages/admin/AdminLedgerPage';
import { AdminPayoutsPage } from './pages/admin/AdminPayoutsPage';
import { AdminRefundsPage } from './pages/admin/AdminRefundsPage';

export default function App() {
  return (
    <ThemeProvider>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="works/:slug" element={<SeriesPage />} />
            <Route path="read/novel/:workId/:chapterId" element={<ReadNovelPage />} />
            <Route path="read/manga/:workId/:chapterId" element={<ReadMangaPage />} />
            <Route path="auth/login" element={<LoginPage />} />
            <Route path="auth/signup" element={<SignupPage />} />
            <Route path="auth/forgot" element={<ForgotPasswordPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="wallet/topup" element={<TopupPage />} />
            <Route path="wallet/pay/:status" element={<PayResultPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="me" element={<MePage />} />
            <Route path="me/settings" element={<SettingsPage />} />
            <Route path="me/settings/delete" element={<DeleteAccountPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="help/report" element={<ReportPage />} />
            <Route path="authors/:authorId" element={<AuthorPage />} />
            <Route path="legal/tos" element={<LegalTosPage />} />
            <Route path="legal/privacy" element={<LegalPrivacyPage />} />
            <Route path="legal/coins" element={<LegalCoinsPage />} />
            <Route path="legal/takedown" element={<LegalTakedownPage />} />

            <Route path="writer" element={<WriterLayout />}>
              <Route index element={<WriterDashboard />} />
              <Route path="works" element={<WriterWorksPage />} />
              <Route path="works/new" element={<WriterWorkForm />} />
              <Route path="works/:workId/edit" element={<WriterWorkForm />} />
              <Route path="works/:workId/chapters/new" element={<WriterChapterForm />} />
              <Route path="works/:workId/chapters/:chapterId/edit" element={<WriterChapterForm />} />
              <Route path="payout" element={<WriterPayoutPage />} />
              <Route path="register" element={<WriterRegisterPage />} />
            </Route>

            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="authors" element={<AdminAuthorsPage />} />
              <Route path="works" element={<AdminWorksPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="takedowns" element={<AdminTakedownsPage />} />
              <Route path="ledger" element={<AdminLedgerPage />} />
              <Route path="payouts" element={<AdminPayoutsPage />} />
              <Route path="refunds" element={<AdminRefundsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
    </ThemeProvider>
  );
}
