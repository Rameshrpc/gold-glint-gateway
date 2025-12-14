import React from 'react';
import BilingualLabel from './BilingualLabel';
import { formatIndianCurrency } from '@/lib/interestCalculations';

interface GoldItem {
  item_type: string;
  description?: string;
  gross_weight_grams: number;
  stone_weight_grams?: number;
  net_weight_grams: number;
  purity: string;
  purity_percentage: number;
  appraised_value: number;
  market_value?: number;
}

interface JewelTableProps {
  items: GoldItem[];
  showMarketValue?: boolean;
  compact?: boolean;
  className?: string;
}

export default function JewelTable({ 
  items, 
  showMarketValue = false,
  compact = false,
  className = '' 
}: JewelTableProps) {
  const totals = items.reduce((acc, item) => ({
    grossWeight: acc.grossWeight + item.gross_weight_grams,
    stoneWeight: acc.stoneWeight + (item.stone_weight_grams || 0),
    netWeight: acc.netWeight + item.net_weight_grams,
    appraisedValue: acc.appraisedValue + item.appraised_value,
    marketValue: acc.marketValue + (item.market_value || 0),
  }), { grossWeight: 0, stoneWeight: 0, netWeight: 0, appraisedValue: 0, marketValue: 0 });

  return (
    <table className={`print-table ${compact ? 'print-table-compact' : ''} ${className}`}>
      <thead>
        <tr>
          <th className="w-8 text-center">
            <BilingualLabel english="S.No" tamil="எண்" />
          </th>
          <th>
            <BilingualLabel english="Item" tamil="பொருள்" />
          </th>
          <th className="text-right w-20">
            <BilingualLabel english="Gross (g)" tamil="மொத்தம்" />
          </th>
          <th className="text-right w-16">
            <BilingualLabel english="Stone" tamil="கல்" />
          </th>
          <th className="text-right w-20">
            <BilingualLabel english="Net (g)" tamil="நிகரம்" />
          </th>
          <th className="text-center w-16">
            <BilingualLabel english="Purity" tamil="தூய்மை" />
          </th>
          <th className="text-right w-24">
            <BilingualLabel english="Value" tamil="மதிப்பு" />
          </th>
          {showMarketValue && (
            <th className="text-right w-24">
              <BilingualLabel english="Market" tamil="சந்தை" />
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <td className="text-center">{index + 1}</td>
            <td>
              <div className="font-medium">{item.item_type}</div>
              {item.description && (
                <div className="text-[8px] text-gray-600">{item.description}</div>
              )}
            </td>
            <td className="text-right">{item.gross_weight_grams.toFixed(2)}</td>
            <td className="text-right">{(item.stone_weight_grams || 0).toFixed(2)}</td>
            <td className="text-right font-medium">{item.net_weight_grams.toFixed(2)}</td>
            <td className="text-center">{item.purity}</td>
            <td className="text-right font-medium">{formatIndianCurrency(item.appraised_value)}</td>
            {showMarketValue && (
              <td className="text-right">{formatIndianCurrency(item.market_value || 0)}</td>
            )}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-bold bg-gray-100">
          <td colSpan={2} className="text-right">
            <BilingualLabel english="TOTAL" tamil="மொத்தம்" inline />
          </td>
          <td className="text-right">{totals.grossWeight.toFixed(2)}</td>
          <td className="text-right">{totals.stoneWeight.toFixed(2)}</td>
          <td className="text-right">{totals.netWeight.toFixed(2)}</td>
          <td></td>
          <td className="text-right">{formatIndianCurrency(totals.appraisedValue)}</td>
          {showMarketValue && (
            <td className="text-right">{formatIndianCurrency(totals.marketValue)}</td>
          )}
        </tr>
      </tfoot>
    </table>
  );
}
