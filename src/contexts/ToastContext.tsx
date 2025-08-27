'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import ToastComponent, { Toast } from '@/components/ui/toast'

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  toasts: Toast[]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const recentToasts = useRef<Map<string, number>>(new Map())

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    // Create a unique key for this toast content
    const toastKey = `${toast.title}-${toast.description}-${toast.type}`
    const now = Date.now()
    
    // Check if we've shown this exact toast recently (within 1000ms)
    const lastShown = recentToasts.current.get(toastKey)
    if (lastShown && (now - lastShown) < 1000) {
      return // Don't show duplicate toast
    }

    // Record this toast as shown
    recentToasts.current.set(toastKey, now)
    
    // Clean up old entries (older than 5 seconds)
    recentToasts.current.forEach((timestamp, key) => {
      if (now - timestamp > 5000) {
        recentToasts.current.delete(key)
      }
    })

    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
    }
    
    setToasts(prevToasts => [...prevToasts, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
        {toasts.map(toast => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
