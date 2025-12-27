import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, CreditCard, IndianRupee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { getSignedUrl } from '@/lib/storage';

interface CustomerSummaryProps {
  customerId: string;
}

interface CustomerDetails {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  photo_url: string | null;
}

interface LoanStats {
  liveLoans: number;
  totalOutstanding: number;
}

export default function CustomerSummaryCard({ customerId }: CustomerSummaryProps) {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loanStats, setLoanStats] = useState<LoanStats>({ liveLoans: 0, totalOutstanding: 0 });
  const [loading, setLoading] = useState(true);
  const [photoSignedUrl, setPhotoSignedUrl] = useState<string | null>(null);
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      setLoading(true);
      try {
        // Fetch customer details
        const { data: customerData } = await supabase
          .from('customers')
          .select('id, customer_code, full_name, phone, email, address, city, state, pincode, photo_url')
          .eq('id', customerId)
          .single();

        if (customerData) {
          setCustomer(customerData);
          // Fetch signed URL for photo
          if (customerData.photo_url) {
            const signedUrl = await getSignedUrl('customer-documents', customerData.photo_url);
            setPhotoSignedUrl(signedUrl);
          }
        }

        // Fetch loan statistics
        const { data: loansData } = await supabase
          .from('loans')
          .select('actual_principal')
          .eq('customer_id', customerId)
          .eq('status', 'active');

        if (loansData) {
          setLoanStats({
            liveLoans: loansData.length,
            totalOutstanding: loansData.reduce((sum, loan) => sum + (loan.actual_principal || 0), 0),
          });
        }
      } catch (error) {
        console.error('Failed to fetch customer details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  if (loading || !customer) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-16 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Use the pre-fetched signed URL for the photo
  const getPhotoUrl = () => {
    return photoSignedUrl;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatAddress = () => {
    const parts = [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean);
    return parts.join(', ') || 'No address';
  };

  return (
    <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-blue-500/30">
            <AvatarImage src={getPhotoUrl() || undefined} alt={customer.full_name} />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
              {getInitials(customer.full_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-lg">{customer.full_name}</h4>
                <Badge variant="secondary" className="text-xs">{customer.customer_code}</Badge>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{loanStats.liveLoans}</span>
                    <span className="text-muted-foreground">Live Loans</span>
                  </div>
                  {loanStats.totalOutstanding > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <IndianRupee className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-amber-600">
                        {formatIndianCurrency(loanStats.totalOutstanding)}
                      </span>
                      <span className="text-muted-foreground">Outstanding</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {customer.phone}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="truncate max-w-xs">{formatAddress()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
