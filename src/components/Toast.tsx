import React, { createContext, useContext, useState, useCallback } from 'react'

interface ToastMessage {
  id: number
  text: string
  type?: 'success' | 'warn' | 'info'
}

interface ToastContextType {
  showToast: (text: string, type?: 'success' | 'warn' | 'info') => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let toastSeq = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((text: string, type: 'success' | 'warn' | 'info' = 'success') => {
    const id = ++toastSeq
    setToasts(prev => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3800)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type || 'success'}`}>
            <span>{t.text}</span>
            <button
              type="button"
              className="ghost"
              style={{ minHeight: '28px', minWidth: '28px', padding: '2px 8px', fontSize: '0.75rem', boxShadow: 'none' }}
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
