import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./pages/Home";
import NotFound from "./pages/NotFound";
import ScannerPage from "./pages/Scanner";
import LoginPage from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import AdminPage from "./pages/Admin";
import LeaderboardPage from "./pages/Leaderboard";
import ProfilePage from "./pages/Profile";
import RewardsPage from "./pages/Rewards";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { ThemeProvider } from "./components/theme-provider";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { ConfettiProvider } from "./components/ConfettiProvider";
import SettingsPage from "./pages/Settings";
import { MadeWithDyad } from "./components/made-with-dyad";
import NfcPage from "./pages/NfcPage";
import AdminValidateTicketPage from "./pages/AdminValidateTicket";
import { MobileNav } from "./components/MobileNav";
import { useIsMobile } from "./hooks/use-mobile";
import RewardHistoryPage from "./pages/RewardHistory";
import LoadingScreen from "./components/LoadingScreen"; // Import LoadingScreen

const queryClient = new QueryClient();

const AppContent = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { loading, user } = useAuth(); // Get loading and user from context

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.dir(i18n.language);
  }, [i18n, i18n.language]);

  // If still loading auth state, show a full-page loader
  if (loading) {
    return <LoadingScreen />;
  }

  // Hide the main app navbar on the landing page for logged-out users
  const hideNavbar = !user && location.pathname === '/';

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className={isMobile ? "pb-16" : ""}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/nfc" element={<NfcPage />} />
          <Route path="/reward-history" element={<RewardHistoryPage />} />
          
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/validate-ticket" element={<AdminValidateTicketPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {isMobile && <MobileNav />}
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Toaster />
          <Sonner position="bottom-center" />
          <BrowserRouter>
            <ConfettiProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </ConfettiProvider>
            <MadeWithDyad />
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;