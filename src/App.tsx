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
import Auction from "./pages/Auction";
import MarketRates from "./pages/MarketRates";
import BanksNbfc from "./pages/BanksNbfc";
import Loyalties from "./pages/Loyalties";
import GoldVault from "./pages/GoldVault";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import AgentCommissions from "./pages/AgentCommissions";
import CommissionReports from "./pages/CommissionReports";
import Vouchers from "./pages/Vouchers";
import BackfillVouchers from "./pages/BackfillVouchers";
import TrialBalance from "./pages/TrialBalance";
import ProfitAndLoss from "./pages/ProfitAndLoss";
import BalanceSheet from "./pages/BalanceSheet";
import LedgerStatement from "./pages/LedgerStatement";
import DayBook from "./pages/DayBook";
import PlaceholderPage from "./pages/placeholder/PlaceholderPage";
import NotFound from "./pages/NotFound";
// Mobile Components
import DeviceAwareWrapper from "./components/DeviceAwareWrapper";
import MobileDashboard from "./components/mobile/MobileDashboard";
import MobileLoans from "./components/mobile/MobileLoans";
import MobileMoreMenu from "./components/mobile/MobileMoreMenu";
import MobileCustomers from "./components/mobile/MobileCustomers";
import MobileInterest from "./components/mobile/MobileInterest";
import MobileRedemption from "./components/mobile/MobileRedemption";
import MobileNewLoan from "./components/mobile/MobileNewLoan";
import MobileReloan from "./components/mobile/MobileReloan";
import MobileAuction from "./components/mobile/MobileAuction";
import MobileSchemes from "./components/mobile/MobileSchemes";
import MobileVouchers from "./components/mobile/MobileVouchers";
import MobileSettings from "./components/mobile/MobileSettings";
import MobileProfile from "./components/mobile/MobileProfile";
import MobileUsers from "./components/mobile/MobileUsers";
import MobileBranches from "./components/mobile/MobileBranches";
import MobileMarketRates from "./components/mobile/MobileMarketRates";
import MobileGoldVault from "./components/mobile/MobileGoldVault";
import MobileDayBook from "./components/mobile/MobileDayBook";
import MobileTrialBalance from "./components/mobile/MobileTrialBalance";
import MobileProfitLoss from "./components/mobile/MobileProfitLoss";
import MobileBalanceSheet from "./components/mobile/MobileBalanceSheet";
import MobileLedgerStatement from "./components/mobile/MobileLedgerStatement";

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
                <DeviceAwareWrapper 
                  mobile={<MobileDashboard />} 
                  desktop={<Dashboard />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileProfile />} 
                  desktop={<Profile />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileCustomers />} 
                  desktop={<Customers />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/branches" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileBranches />} 
                  desktop={<Branches />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileUsers />} 
                  desktop={<Users />} 
                />
              </ProtectedRoute>
            } />
            
            {/* Loans & Operations */}
            <Route path="/loans" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileLoans />} 
                  desktop={<Loans />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/new-loan" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileNewLoan />} 
                  desktop={<Loans />} 
                />
              </ProtectedRoute>
            } />
            
            {/* Mobile More Menu */}
            <Route path="/more" element={
              <ProtectedRoute>
                <MobileMoreMenu />
              </ProtectedRoute>
            } />
            <Route path="/schemes" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileSchemes />} 
                  desktop={<Schemes />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/interest" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileInterest />} 
                  desktop={<Interest />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/redemption" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileRedemption />} 
                  desktop={<Redemption />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/reloan" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileReloan />} 
                  desktop={<Reloan />} 
                />
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
            <Route path="/market-rates" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileMarketRates />} 
                  desktop={<MarketRates />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/auction" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileAuction />} 
                  desktop={<Auction />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/banks-nbfc" element={
              <ProtectedRoute>
                <BanksNbfc />
              </ProtectedRoute>
            } />
            <Route path="/loyalties" element={
              <ProtectedRoute>
                <Loyalties />
              </ProtectedRoute>
            } />
            <Route path="/gold-vault" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileGoldVault />} 
                  desktop={<GoldVault />} 
                />
              </ProtectedRoute>
            } />
            
            {/* Financial Reports */}
            <Route path="/reports" element={<Navigate to="/trial-balance" replace />} />
            <Route path="/trial-balance" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileTrialBalance />} 
                  desktop={<TrialBalance />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/profit-loss" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileProfitLoss />} 
                  desktop={<ProfitAndLoss />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/balance-sheet" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileBalanceSheet />} 
                  desktop={<BalanceSheet />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/ledger-statement" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileLedgerStatement />} 
                  desktop={<LedgerStatement />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/day-book" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileDayBook />} 
                  desktop={<DayBook />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <ChartOfAccounts />
              </ProtectedRoute>
            } />
            <Route path="/agent-commissions" element={
              <ProtectedRoute>
                <AgentCommissions />
              </ProtectedRoute>
            } />
            <Route path="/commission-reports" element={
              <ProtectedRoute>
                <CommissionReports />
              </ProtectedRoute>
            } />
            <Route path="/vouchers" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileVouchers />} 
                  desktop={<Vouchers />} 
                />
              </ProtectedRoute>
            } />
            <Route path="/backfill-vouchers" element={
              <ProtectedRoute>
                <BackfillVouchers />
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
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <DeviceAwareWrapper 
                  mobile={<MobileSettings />} 
                  desktop={<Settings />} 
                />
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
