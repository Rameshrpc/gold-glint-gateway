import React from 'react';

interface PrintFooterProps {
  branchName?: string;
  preparedBy?: string;
  checkedBy?: string;
  showComputerGenerated?: boolean;
}

export default function PrintFooter({
  branchName,
  preparedBy,
  checkedBy,
  showComputerGenerated = true,
}: PrintFooterProps) {
  return (
    <div className="print-footer">
      <div className="flex justify-between items-center text-[9px] text-gray-600">
        <div>
          {branchName && <span>Branch: {branchName}</span>}
          {preparedBy && <span className="ml-4">Prepared by: {preparedBy}</span>}
          {checkedBy && <span className="ml-4">Checked by: {checkedBy}</span>}
        </div>
        <div className="flex items-center gap-4">
          {showComputerGenerated && (
            <span className="italic">கணினி ரசீது / Computer Generated Receipt</span>
          )}
          <span>Printed: {new Date().toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
