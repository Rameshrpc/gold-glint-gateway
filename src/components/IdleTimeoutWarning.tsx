import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';

interface IdleTimeoutWarningProps {
  open: boolean;
  remainingSeconds: number;
  onStayLoggedIn: () => void;
}

export function IdleTimeoutWarning({
  open,
  remainingSeconds,
  onStayLoggedIn,
}: IdleTimeoutWarningProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Your session will expire in{' '}
            <span className="font-bold text-foreground">
              {remainingSeconds} seconds
            </span>{' '}
            due to inactivity. Click below to stay logged in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onStayLoggedIn}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
