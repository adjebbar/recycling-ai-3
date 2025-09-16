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
import ChallengesPage from "./pages/Challenges";
import RewardsPage from "./pages/Rewards";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { ThemeProvider } from "./components/theme-provider";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { ConfettiProvider } from "./components/ConfettiProvider";
import SettingsPage from "./pages/Settings";
import { ScanFAB } from "./components/ScanFAB";
import { MadeWithDyad } from "./components/made-with-dyad"; // Import MadeWithDyad

const queryClient = new QueryClient();

const AppContent = () => {
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.dir(i18n.language);
  }, [i18n, i18n.language]);

  const hideFABOnRoutes = ['/scanner', '/login', '/signup'];
  const showFAB = !hideFABOnRoutes.includes(location.pathname);

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {showFAB && <ScanFAB />}
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
            <MadeWithDyad /> {/* Added MadeWithDyad here */}
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;