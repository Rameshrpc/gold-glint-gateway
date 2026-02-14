import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { IdleTimeoutProvider } from "@/components/IdleTimeoutProvider";

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
import Approvals from "./pages/Approvals";
import ItemGroups from "./pages/ItemGroups";
import Reloan from "./pages/Reloan";
import Auction from "./pages/Auction";
import SaleAgreements from "./pages/SaleAgreements";
import SaleMarginRenewal from "./pages/SaleMarginRenewal";
import SaleRepurchase from "./pages/SaleRepurchase";
import SaleSchemes from "./pages/SaleSchemes";
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
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import ActivityLog from "./pages/ActivityLog";
import PlaceholderPage from "./pages/placeholder/PlaceholderPage";
import NotificationLogs from "./pages/NotificationLogs";
import NotFound from "./pages/NotFound";

// Customer Portal
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";
import { CustomerProtectedRoute } from "@/components/customer-portal/CustomerProtectedRoute";
import CustomerPortalAuth from "./pages/customer-portal/CustomerPortalAuth";
import CustomerDashboard from "./pages/customer-portal/CustomerDashboard";
import CustomerLoanDetails from "./pages/customer-portal/CustomerLoanDetails";
import CustomerAllLoans from "./pages/customer-portal/CustomerAllLoans";
import CustomerPayments from "./pages/customer-portal/CustomerPayments";
import CustomerLoanStatement from "./pages/customer-portal/CustomerLoanStatement";

const queryClient = new QueryClient();

// Main application component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AuthProvider>
          <IdleTimeoutProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/setup" element={<Setup />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/branches" element={<ProtectedRoute><Branches /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            
            {/* Loans & Operations */}
            <Route path="/loans" element={<ProtectedRoute requiredFeature="loans"><Loans /></ProtectedRoute>} />
            <Route path="/new-loan" element={<ProtectedRoute requiredFeature="loans"><Loans /></ProtectedRoute>} />
            <Route path="/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
            <Route path="/interest" element={<ProtectedRoute requiredFeature="loans"><Interest /></ProtectedRoute>} />
            <Route path="/redemption" element={<ProtectedRoute requiredFeature="loans"><Redemption /></ProtectedRoute>} />
            <Route path="/reloan" element={<ProtectedRoute requiredFeature="loans"><Reloan /></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute requiredFeature="agents"><Agents /></ProtectedRoute>} />
            <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
            <Route path="/item-groups" element={<ProtectedRoute><ItemGroups /></ProtectedRoute>} />
            <Route path="/market-rates" element={<ProtectedRoute><MarketRates /></ProtectedRoute>} />
            <Route path="/auction" element={<ProtectedRoute requiredFeature="loans"><Auction /></ProtectedRoute>} />
            
            {/* Sale Agreements (Trading Format) */}
            <Route path="/sale-agreements" element={<ProtectedRoute requiredFeature="sale_agreements"><SaleAgreements /></ProtectedRoute>} />
            <Route path="/sale-schemes" element={<ProtectedRoute requiredFeature="sale_agreements"><SaleSchemes /></ProtectedRoute>} />
            <Route path="/sale-margin-renewal" element={<ProtectedRoute requiredFeature="sale_agreements"><SaleMarginRenewal /></ProtectedRoute>} />
            <Route path="/sale-repurchase" element={<ProtectedRoute requiredFeature="sale_agreements"><SaleRepurchase /></ProtectedRoute>} />
            
            <Route path="/banks-nbfc" element={<ProtectedRoute><BanksNbfc /></ProtectedRoute>} />
            <Route path="/loyalties" element={<ProtectedRoute><Loyalties /></ProtectedRoute>} />
            <Route path="/gold-vault" element={<ProtectedRoute requiredFeature="gold_vault"><GoldVault /></ProtectedRoute>} />
            
            {/* Financial Reports */}
            <Route path="/reports" element={<Navigate to="/mis-reports" replace />} />
            <Route path="/mis-reports" element={<ProtectedRoute requiredFeature="reports"><Reports /></ProtectedRoute>} />
            <Route path="/audit-logs" element={<ProtectedRoute requiredFeature="reports"><AuditLogs /></ProtectedRoute>} />
            <Route path="/activity-log" element={<ProtectedRoute requiredFeature="reports"><ActivityLog /></ProtectedRoute>} />
            <Route path="/trial-balance" element={<ProtectedRoute requiredFeature="accounting"><TrialBalance /></ProtectedRoute>} />
            <Route path="/profit-loss" element={<ProtectedRoute requiredFeature="accounting"><ProfitAndLoss /></ProtectedRoute>} />
            <Route path="/balance-sheet" element={<ProtectedRoute requiredFeature="accounting"><BalanceSheet /></ProtectedRoute>} />
            <Route path="/ledger-statement" element={<ProtectedRoute requiredFeature="accounting"><LedgerStatement /></ProtectedRoute>} />
            <Route path="/day-book" element={<ProtectedRoute requiredFeature="accounting"><DayBook /></ProtectedRoute>} />
            <Route path="/accounts" element={<ProtectedRoute requiredFeature="accounting"><ChartOfAccounts /></ProtectedRoute>} />
            <Route path="/agent-commissions" element={<ProtectedRoute requiredFeature="agents"><AgentCommissions /></ProtectedRoute>} />
            <Route path="/commission-reports" element={<ProtectedRoute requiredFeature="agents"><CommissionReports /></ProtectedRoute>} />
            <Route path="/vouchers" element={<ProtectedRoute requiredFeature="accounting"><Vouchers /></ProtectedRoute>} />
            <Route path="/backfill-vouchers" element={<ProtectedRoute requiredFeature="accounting"><BackfillVouchers /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute requiredFeature="notifications"><NotificationLogs /></ProtectedRoute>} />
            <Route path="/notification-logs" element={<ProtectedRoute requiredFeature="notifications"><NotificationLogs /></ProtectedRoute>} />
            <Route path="/whatsapp" element={<ProtectedRoute requiredFeature="notifications"><NotificationLogs /></ProtectedRoute>} />
            <Route path="/sms" element={<ProtectedRoute requiredFeature="notifications"><NotificationLogs /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute requiredFeature="approvals"><Approvals /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Customer Portal Routes - Separate Auth Context */}
          <Routes>
            <Route path="/customer-portal" element={<CustomerAuthProvider><CustomerPortalAuth /></CustomerAuthProvider>} />
            <Route path="/customer-portal/dashboard" element={<CustomerAuthProvider><CustomerProtectedRoute><CustomerDashboard /></CustomerProtectedRoute></CustomerAuthProvider>} />
            <Route path="/customer-portal/loans" element={<CustomerAuthProvider><CustomerProtectedRoute><CustomerAllLoans /></CustomerProtectedRoute></CustomerAuthProvider>} />
            <Route path="/customer-portal/payments" element={<CustomerAuthProvider><CustomerProtectedRoute><CustomerPayments /></CustomerProtectedRoute></CustomerAuthProvider>} />
            <Route path="/customer-portal/loan/:loanId" element={<CustomerAuthProvider><CustomerProtectedRoute><CustomerLoanDetails /></CustomerProtectedRoute></CustomerAuthProvider>} />
            <Route path="/customer-portal/loan/:loanId/statement" element={<CustomerAuthProvider><CustomerProtectedRoute><CustomerLoanStatement /></CustomerProtectedRoute></CustomerAuthProvider>} />
          </Routes>
          </IdleTimeoutProvider>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
