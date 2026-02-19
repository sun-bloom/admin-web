import { Toaster, toast as sonnerToast } from 'sonner'

// Wrapper for sonner toast with simpler API
export function toast(options: { title: string; description?: string; variant?: 'default' | 'destructive' }) {
  if (options.variant === 'destructive') {
    sonnerToast.error(options.title, {
      description: options.description,
    })
  } else {
    sonnerToast.success(options.title, {
      description: options.description,
    })
  }
}

export function ToastProvider() {
  return <Toaster position="top-right" />
}
