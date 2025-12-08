import { ReactNode } from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';

interface DeviceAwareWrapperProps {
  mobile: ReactNode;
  desktop: ReactNode;
}

export default function DeviceAwareWrapper({ mobile, desktop }: DeviceAwareWrapperProps) {
  const { isMobile } = useDeviceType();
  
  return <>{isMobile ? mobile : desktop}</>;
}
