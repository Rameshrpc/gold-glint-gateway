import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Branches from "./pages/Branches";
import PlaceholderPage from "./pages/placeholder/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/branches" element={
              <ProtectedRoute>
                <Branches />
              </ProtectedRoute>
            } />
            
            {/* Placeholder Routes - Phase 2+ */}
            <Route path="/loans" element={
              <ProtectedRoute>
                <PlaceholderPage title="Loans" description="Manage loan pledges and disbursements" />
              </ProtectedRoute>
            } />
            <Route path="/interest" element={
              <ProtectedRoute>
                <PlaceholderPage title="Interest Servicing" description="Track and collect interest payments" />
              </ProtectedRoute>
            } />
            <Route path="/redemption" element={
              <ProtectedRoute>
                <PlaceholderPage title="Redemption" description="Process loan closures and redemptions" />
              </ProtectedRoute>
            } />
            <Route path="/agents" element={
              <ProtectedRoute>
                <PlaceholderPage title="Agents" description="Manage referral agents and commissions" />
              </ProtectedRoute>
            } />
            <Route path="/auction" element={
              <ProtectedRoute>
                <PlaceholderPage title="Auction" description="Manage overdue loans and auctions" />
              </ProtectedRoute>
            } />
            <Route path="/schemes" element={
              <ProtectedRoute>
                <PlaceholderPage title="Schemes" description="Configure loan schemes and rates" />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <PlaceholderPage title="Users" description="Manage user accounts and roles" />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <PlaceholderPage title="Reports" description="View business reports and analytics" />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <PlaceholderPage title="Notifications" description="Manage alerts and reminders" />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <PlaceholderPage title="Settings" description="Configure system settings" />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
