import { toast } from 'sonner';
import { Notifier } from '@/features/forms/application/ports/notifier';

export const sonnerNotifier: Notifier = {
    success: (title, description) => {
        toast.success(title, { description });
    },
    error: (title, description) => {
        toast.error(title, { description });
    },
};
