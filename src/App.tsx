import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Dashboard } from './pages/Dashboard'
import { PriceDetail } from './pages/PriceDetail'
import { NotFound } from './pages/NotFound'

const PriceDetail = lazy(() =>
  import('./pages/PriceDetail').then((m) => ({ default: m.PriceDetail })),
)
import { useWebVitals } from './hooks/useWebVitals'
import { useAccessibility } from './hooks/useAccessibility'
import { AlertsProvider } from './hooks/useAlerts'
import { PreferencesProvider } from './preferences/PreferencesContext'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/ToastContainer'
import { AnalyticsProvider } from './context/AnalyticsContext'
import { AnalyticsConsentBanner } from './components/AnalyticsConsentBanner'
import { AnalyticsCollector } from './utils/analytics'
import { config } from './config'

const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '')

// Initialize analytics on module load
if (config.analyticsEndpoint) {
  AnalyticsCollector.init(config.analyticsEndpoint)
}

function AppContent() {
  const location = useLocation()
  return (
    <ErrorBoundary key={location.key}>
      <PreferencesProvider>
        <Layout>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/price/:pair" element={<PriceDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
        <AlertsProvider>
          <AccessibilityAwareLayout />
        </AlertsProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  )
}

// Observability overlay lives inside PriceProvider so it can access wsStatus
function ObservabilityOverlay() {
  const [visible, setVisible] = useState(false)
  const { wsStatus, refetchPrices, pricesError } = usePriceContext()
  const isApiReachable = !pricesError

  const { probes, overallHealth, healingHistory, forceHeal } = useObservability({
    wsStatus,
    isApiReachable,
    reconnectWs: refetchPrices,
    refetchState: refetchPrices,
  })

  // Ctrl+Shift+O toggles the observability panel (#117 requirement)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault()
        setVisible((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!visible) return null

  return (
    <ObservabilityDashboard
      probes={probes}
      overallHealth={overallHealth}
      healingHistory={healingHistory}
      onForceHeal={forceHeal}
    />
function AccessibilityAwareLayout() {
  useAccessibility()
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/price/:pair" element={<PriceDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  useWebVitals()

  return (
    <BrowserRouter basename={BASENAME}>
      <ToastProvider>
        <AnalyticsProvider endpoint={config.analyticsEndpoint}>
          <AppContent />
          <ToastContainer />
          <AnalyticsConsentBanner />
        </AnalyticsProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
