import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, FileText, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  code: string;
  name: string;
  type: 'customer' | 'loan';
  extra?: string;
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { client } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const searchData = useCallback(async (searchQuery: string) => {
    if (!client || searchQuery.length < 4) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchPattern = `%${searchQuery}%`;
      
      // Search customers and loans in parallel
      const [customersResult, loansResult] = await Promise.all([
        supabase
          .from('customers')
          .select('id, customer_code, full_name, phone')
          .eq('client_id', client.id)
          .or(`customer_code.ilike.${searchPattern},full_name.ilike.${searchPattern},phone.ilike.${searchPattern}`)
          .limit(5),
        supabase
          .from('loans')
          .select('id, loan_number, principal_amount, customers!inner(full_name)')
          .eq('client_id', client.id)
          .or(`loan_number.ilike.${searchPattern}`)
          .limit(5)
      ]);

      const searchResults: SearchResult[] = [];

      // Add customer results
      if (customersResult.data) {
        customersResult.data.forEach((c: any) => {
          searchResults.push({
            id: c.id,
            code: c.customer_code,
            name: c.full_name,
            type: 'customer',
            extra: c.phone
          });
        });
      }

      // Add loan results
      if (loansResult.data) {
        loansResult.data.forEach((l: any) => {
          searchResults.push({
            id: l.id,
            code: l.loan_number,
            name: l.customers?.full_name || 'Unknown',
            type: 'loan',
            extra: `₹${l.principal_amount?.toLocaleString('en-IN')}`
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Debounce search
  useEffect(() => {
    if (query.length < 4) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchData(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchData]);

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    
    if (result.type === 'customer') {
      navigate('/customers', { state: { highlightId: result.id } });
    } else {
      navigate('/loans', { state: { highlightId: result.id } });
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const customerResults = results.filter(r => r.type === 'customer');
  const loanResults = results.filter(r => r.type === 'loan');

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-200/50" />
        <Input
          placeholder="Search (4+ chars)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-8 bg-white/10 border-amber-700/50 text-white placeholder:text-amber-200/50 focus:bg-white/20"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-200/50 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 4 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              {customerResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    CUSTOMERS
                  </div>
                  {customerResults.map((result) => (
                    <button
                      key={`customer-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{result.code}</span>
                          <span className="font-medium truncate">{result.name}</span>
                        </div>
                        {result.extra && (
                          <div className="text-xs text-muted-foreground">{result.extra}</div>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">Customer</Badge>
                    </button>
                  ))}
                </div>
              )}

              {loanResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    LOANS
                  </div>
                  {loanResults.map((result) => (
                    <button
                      key={`loan-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{result.code}</span>
                          <span className="font-medium truncate">{result.name}</span>
                        </div>
                        {result.extra && (
                          <div className="text-xs text-muted-foreground">{result.extra}</div>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">Loan</Badge>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && query.length >= 4 && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
