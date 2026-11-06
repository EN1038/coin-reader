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
import { WriterStubPage, AdminStubPage } from './pages/StubPages';

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
            <Route path="wallet" element={<WalletPage />} />
            <Route path="wallet/topup" element={<TopupPage />} />
            <Route path="wallet/pay/:status" element={<PayResultPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="me" element={<MePage />} />
            <Route path="legal/tos" element={<LegalTosPage />} />
            <Route path="legal/privacy" element={<LegalPrivacyPage />} />
            <Route path="legal/coins" element={<LegalCoinsPage />} />
            <Route path="writer" element={<WriterStubPage />} />
            <Route path="admin" element={<AdminStubPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
    </ThemeProvider>
  );
}
