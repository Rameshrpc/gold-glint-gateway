import React from 'react';

interface PrintPageWrapperProps {
  children: React.ReactNode;
  landscape?: boolean;
  className?: string;
}

export default function PrintPageWrapper({ 
  children, 
  landscape = false,
  className = '' 
}: PrintPageWrapperProps) {
  return (
    <div className={`${landscape ? 'print-page-landscape' : 'print-page'} bg-white ${className}`}>
      {children}
    </div>
  );
}
