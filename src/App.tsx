import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Customers from "./pages/Customers";
import Branches from "./pages/Branches";
import Clients from "./pages/Clients";
import Users from "./pages/Users";
import Schemes from "./pages/Schemes";
import Loans from "./pages/Loans";
import Interest from "./pages/Interest";
import Redemption from "./pages/Redemption";
import Settings from "./pages/Settings";
import Agents from "./pages/Agents";
import Items from "./pages/Items";
import ItemGroups from "./pages/ItemGroups";
import Reloan from "./pages/Reloan";
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
            <Route path="/setup" element={<Setup />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
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
            <Route path="/clients" element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } />
            
            {/* Loans & Operations */}
            <Route path="/loans" element={
              <ProtectedRoute>
                <Loans />
              </ProtectedRoute>
            } />
            <Route path="/schemes" element={
              <ProtectedRoute>
                <Schemes />
              </ProtectedRoute>
            } />
            <Route path="/interest" element={
              <ProtectedRoute>
                <Interest />
              </ProtectedRoute>
            } />
            <Route path="/redemption" element={
              <ProtectedRoute>
                <Redemption />
              </ProtectedRoute>
            } />
            <Route path="/reloan" element={
              <ProtectedRoute>
                <Reloan />
              </ProtectedRoute>
            } />
            <Route path="/agents" element={
              <ProtectedRoute>
                <Agents />
              </ProtectedRoute>
            } />
            <Route path="/items" element={
              <ProtectedRoute>
                <Items />
              </ProtectedRoute>
            } />
            <Route path="/item-groups" element={
              <ProtectedRoute>
                <ItemGroups />
              </ProtectedRoute>
            } />
            <Route path="/auction" element={
              <ProtectedRoute>
                <PlaceholderPage title="Auction" description="Manage overdue loans and auctions" />
              </ProtectedRoute>
            } />
            
            {/* Reports & Communications */}
            <Route path="/reports" element={
              <ProtectedRoute>
                <PlaceholderPage title="Reports" description="View business reports and analytics" />
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <PlaceholderPage title="Accounts" description="Manage financial accounts and ledgers" />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <PlaceholderPage title="Notifications" description="Manage alerts and reminders" />
              </ProtectedRoute>
            } />
            <Route path="/whatsapp" element={
              <ProtectedRoute>
                <PlaceholderPage title="WhatsApp" description="Send WhatsApp messages to customers" />
              </ProtectedRoute>
            } />
            <Route path="/sms" element={
              <ProtectedRoute>
                <PlaceholderPage title="SMS" description="Send SMS notifications to customers" />
              </ProtectedRoute>
            } />
            
            {/* Configuration */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/print-setup" element={
              <ProtectedRoute>
                <PlaceholderPage title="Print Setup" description="Configure print templates and settings" />
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
