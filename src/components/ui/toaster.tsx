"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Toaster() {
  const { toasts } = useToast()

  const handleCopyToast = (title?: string, description?: React.ReactNode) => {
    let textToCopy = ''
    if (title) textToCopy += title
    if (description) {
      if (textToCopy) textToCopy += '\n'
      // Extract text from React nodes
      textToCopy += typeof description === 'string' ? description : String(description)
    }
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).catch(err => {
        console.error('Failed to copy text:', err)
      })
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1 flex-1 select-text">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-70 hover:opacity-100"
                onClick={() => handleCopyToast(title, description)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              {action}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
