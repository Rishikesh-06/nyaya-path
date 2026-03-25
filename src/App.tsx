import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import RoleSelection from "./pages/RoleSelection";
import VictimLayout from "./layouts/VictimLayout";
import VictimHome from "./pages/victim/VictimHome";
import SahaayChat from "./pages/victim/SahaayChat";
import UploadDocument from "./pages/victim/UploadDocument";
import FindLawyer from "./pages/victim/FindLawyer";
import VictimAppointments from "./pages/victim/VictimAppointments";
import LawyerLayout from "./layouts/LawyerLayout";
import LawyerHome from "./pages/lawyer/LawyerHome";
import CaseFeed from "./pages/lawyer/CaseFeed";
import AIToolkit from "./pages/lawyer/AIToolkit";
import Leaderboard from "./pages/lawyer/Leaderboard";
import LawyerCases from "./pages/lawyer/LawyerCases";
import Mentorship from "./pages/lawyer/Mentorship";
import LawyerAppointments from "./pages/lawyer/LawyerAppointments";
import CommunityPage from "./pages/lawyer/CommunityPage";
import StudentLayout from "./layouts/StudentLayout";
import StudentHome from "./pages/student/StudentHome";
import FindMentors from "./pages/student/FindMentors";
import Portfolio from "./pages/student/Portfolio";
import StudentInternships from "./pages/student/StudentInternships";
import CaseObserver from "./pages/student/CaseObserver";
import MyBadges from "./pages/student/MyBadges";
import StudentCommunityPage from "./pages/student/StudentCommunityPage";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import MyCases from "./pages/victim/MyCases";
import Deadlines from "./pages/victim/Deadlines";
import CaseChat from "./pages/CaseChat";
import VideoCallPage from "./pages/VideoCallPage";
import LawyerChat from "./pages/lawyer/LawyerChat";
import MentorshipChat from "./pages/MentorshipChat";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center mesh-bg">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-nyaya-gold border-t-transparent animate-spin" />
      <p className="font-body text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64">
    <p className="font-body text-muted-foreground">{title} — Coming soon</p>
  </div>
);

const AppRoutes = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={user?.role === 'lawyer' ? '/lawyer' : user?.role === 'student' ? '/student' : '/dashboard'} /> : <LandingPage />} />
      <Route path="/welcome" element={isAuthenticated ? <Navigate to={user?.role === 'lawyer' ? '/lawyer' : user?.role === 'student' ? '/student' : '/dashboard'} /> : <RoleSelection />} />

      {/* ── Video Call — full screen ── */}
      <Route path="/video-call/:caseId" element={isAuthenticated ? <VideoCallPage /> : <Navigate to="/welcome" />} />

      <Route path="/dashboard" element={isAuthenticated && user?.role === 'victim' ? <VictimLayout /> : <Navigate to="/welcome" />}>
        <Route index element={<VictimHome />} />
        <Route path="sahaay" element={<SahaayChat />} />
        <Route path="upload" element={<UploadDocument />} />
        <Route path="lawyers" element={<FindLawyer />} />
        <Route path="cases" element={<MyCases />} />
        <Route path="cases/:caseId/chat" element={<CaseChat />} />
        <Route path="book" element={<VictimAppointments />} />
        <Route path="deadlines" element={<Deadlines />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/lawyer" element={isAuthenticated && user?.role === 'lawyer' ? <LawyerLayout /> : <Navigate to="/welcome" />}>
        <Route index element={<LawyerHome />} />
        <Route path="feed" element={<CaseFeed />} />
        <Route path="toolkit" element={<AIToolkit />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="cases" element={<LawyerCases />} />
        <Route path="cases/:caseId/chat" element={<CaseChat />} />
        <Route path="mentorship" element={<Mentorship />} />
        <Route path="mentorship/chat/:mentorshipId" element={<MentorshipChat role="lawyer" />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="community/chat/:lawyerId" element={<LawyerChat />} />
        <Route path="appointments" element={<LawyerAppointments />} />
        <Route path="profile" element={<PlaceholderPage title="My Profile" />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/student" element={isAuthenticated && user?.role === 'student' ? <StudentLayout /> : <Navigate to="/welcome" />}>
        <Route index element={<StudentHome />} />
        <Route path="mentors" element={<FindMentors />} />
        <Route path="community" element={<StudentCommunityPage />} />
        <Route path="internships" element={<StudentInternships />} />
        <Route path="mentorship/chat/:mentorshipId" element={<MentorshipChat role="student" />} />
        <Route path="observer" element={<CaseObserver />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="badges" element={<MyBadges />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <AppRoutes />
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;