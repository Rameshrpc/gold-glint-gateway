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

// Print Pages
import LoanDeclaration from "./pages/print/LoanDeclaration";
import JewelDetails from "./pages/print/JewelDetails";
import KycDocuments from "./pages/print/KycDocuments";
import InterestReceiptPrint from "./pages/print/InterestReceiptPrint";
import AuctionNoticePrint from "./pages/print/AuctionNoticePrint";

// Mobile Components
import DeviceAwareWrapper from "./components/DeviceAwareWrapper";
import MobileDashboard from "./components/mobile/MobileDashboard";
import MobileLoans from "./components/mobile/MobileLoans";
import MobileMoreMenu from "./components/mobile/MobileMoreMenu";

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
                <DeviceAwareWrapper 
                  mobile={<MobileLoans />} 
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
            <Route path="/market-rates" element={
              <ProtectedRoute>
                <MarketRates />
              </ProtectedRoute>
            } />
            <Route path="/auction" element={
              <ProtectedRoute>
                <Auction />
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
                <GoldVault />
              </ProtectedRoute>
            } />
            
            {/* Financial Reports */}
            <Route path="/reports" element={<Navigate to="/trial-balance" replace />} />
            <Route path="/trial-balance" element={
              <ProtectedRoute><TrialBalance /></ProtectedRoute>
            } />
            <Route path="/profit-loss" element={
              <ProtectedRoute><ProfitAndLoss /></ProtectedRoute>
            } />
            <Route path="/balance-sheet" element={
              <ProtectedRoute><BalanceSheet /></ProtectedRoute>
            } />
            <Route path="/ledger-statement" element={
              <ProtectedRoute><LedgerStatement /></ProtectedRoute>
            } />
            <Route path="/day-book" element={
              <ProtectedRoute><DayBook /></ProtectedRoute>
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
                <Vouchers />
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
            
            {/* Configuration */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Print Routes - Public */}
            <Route path="/print/loan-declaration" element={<LoanDeclaration />} />
            <Route path="/print/jewel-details" element={<JewelDetails />} />
            <Route path="/print/kyc-docs" element={<KycDocuments />} />
            <Route path="/print/interest-receipt" element={<InterestReceiptPrint />} />
            <Route path="/print/auction-notice" element={<AuctionNoticePrint />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
