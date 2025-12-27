import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calculator, Calendar, IndianRupee, Percent } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/interestCalculations';

interface InterestCalculatorProps {
  defaultInterestRate?: number;
}

export function InterestCalculator({ defaultInterestRate = 1.5 }: InterestCalculatorProps) {
  const [principal, setPrincipal] = useState<string>('50000');
  const [interestRate, setInterestRate] = useState<number>(defaultInterestRate);
  const [tenureMonths, setTenureMonths] = useState<number>(6);

  const calculation = useMemo(() => {
    const principalAmount = parseFloat(principal) || 0;
    const monthlyInterest = principalAmount * (interestRate / 100);
    const totalInterest = monthlyInterest * tenureMonths;
    const totalPayable = principalAmount + totalInterest;
    const dailyInterest = (principalAmount * (interestRate / 100)) / 30;

    return {
      principalAmount,
      monthlyInterest,
      totalInterest,
      totalPayable,
      dailyInterest,
    };
  }, [principal, interestRate, tenureMonths]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Interest Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Principal Input */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Loan Amount</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="pl-9"
              placeholder="Enter amount"
            />
          </div>
        </div>

        {/* Interest Rate Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Interest Rate</Label>
            <span className="text-sm font-medium flex items-center gap-1">
              {interestRate.toFixed(1)}% <span className="text-xs text-muted-foreground">per month</span>
            </span>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={(v) => setInterestRate(v[0])}
            min={0.5}
            max={3}
            step={0.1}
            className="py-2"
          />
        </div>

        {/* Tenure Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Tenure</Label>
            <span className="text-sm font-medium">{tenureMonths} months</span>
          </div>
          <Slider
            value={[tenureMonths]}
            onValueChange={(v) => setTenureMonths(v[0])}
            min={1}
            max={12}
            step={1}
            className="py-2"
          />
        </div>

        {/* Results */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly Interest</span>
            <span className="font-medium">{formatIndianCurrency(calculation.monthlyInterest)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Daily Interest</span>
            <span className="font-medium">{formatIndianCurrency(calculation.dailyInterest)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Interest ({tenureMonths}m)</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {formatIndianCurrency(calculation.totalInterest)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-medium">Total Payable</span>
            <span className="font-bold text-primary">
              {formatIndianCurrency(calculation.totalPayable)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
