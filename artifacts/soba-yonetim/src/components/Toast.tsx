import { toast } from 'sonner';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import type { SoundType } from '@/hooks/useSoundFeedback';

const soundTypeMap: Record<string, SoundType> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'notification',
};

export function useToast() {
  const { playSound } = useSoundFeedback();

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    playSound(soundTypeMap[type]);
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else if (type === 'warning') toast.warning(message);
    else toast.info(message);
  };

  return { showToast };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
