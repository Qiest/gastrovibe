/* src/components/Toast.jsx
   Kullanım:
     const { toasts, info } = useToast()
     <ToastStack toasts={toasts} />
     info('Yakında geliyor! 🚀')
*/
const STYLES = {
  success: 'bg-gv-emerald text-white',
  info:    'bg-gv-ink    text-white',
  warn:    'bg-amber-500 text-white',
  error:   'bg-red-600   text-white',
}

const ICONS = { success: '✅', info: 'ℹ️', warn: '⚠️', error: '❌' }

export function ToastStack({ toasts }) {
  if (!toasts?.length) return null
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[900] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full shadow-xl text-sm font-semibold whitespace-nowrap
            ${STYLES[t.type] || STYLES.info}`}
          style={{ animation: 'panelUp 0.25s ease' }}
        >
          <span>{ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
