import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePriceContext } from '../context/PriceContext'
import { useAlerts } from '../hooks/useAlerts'
import { usePriceHistory } from '../hooks/usePriceHistory'
import { PriceChart } from '../components/PriceChart'
import { AlertModal } from '../components/AlertModal'
import { formatPrice, timeAgo } from '../utils/format'
import type { AlertFormData } from '../types'

const SOURCE_COLORS: Record<string, string> = {
  chainlink: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  redstone: 'bg-red-500/20 text-red-400 border-red-500/30',
  band: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  reflector: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

export function PriceDetail() {
  const { pair } = useParams<{ pair: string }>()
  const navigate = useNavigate()
  const decodedPair = pair ? decodeURIComponent(pair) : ''

  const { prices, pricesLoading, pricesError, livePrices } = usePriceContext()
  const { alerts, addAlert, removeAlert, hasAlertsForPair } = useAlerts()
  const { history, loading: historyLoading } = usePriceHistory(decodedPair)

  const [modalOpen, setModalOpen] = useState(false)

  const price = useMemo(() => {
    if (!decodedPair) return null
    const live = livePrices.get(decodedPair)
    if (live && live.data.timestamp >= (prices.find((p) => p.assetPair === decodedPair)?.timestamp ?? 0)) {
      return { ...live.data, syncState: live.syncState }
    }
    return prices.find((p) => p.assetPair === decodedPair) ?? null
  }, [prices, livePrices, decodedPair])

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleAlertClick = useCallback(() => {
    setModalOpen(true)
  }, [])

  const handleSave = useCallback(
    (data: AlertFormData) => {
      addAlert({
        assetPair: data.assetPair,
        upperThreshold: data.upperThreshold ? Number.parseFloat(data.upperThreshold) : null,
        lowerThreshold: data.lowerThreshold ? Number.parseFloat(data.lowerThreshold) : null,
        triggerOnce: data.triggerOnce,
        active: true,
      })
      setModalOpen(false)
    },
    [addAlert],
  )

  if (pricesLoading && !price) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (pricesError && !price) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{pricesError}</p>
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!price) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Price data not available for {decodedPair}</p>
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const confidencePct = (price.confidence * 100).toFixed(1)

  return (
    <div className="max-w-4xl mx-auto">
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-6"
        aria-label="Back to Dashboard"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">{decodedPair}</h1>
        </div>

        <div className="text-5xl font-bold text-white mb-4 font-mono tracking-tight">
          ${formatPrice(price.price)}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
          <span>Updated {timeAgo(price.timestamp)}</span>
          <span className="text-cyan-400">{confidencePct}% confidence</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-6">
          {price.sources.map((src) => (
            <span
              key={src}
              className={`px-2 py-0.5 rounded text-xs font-medium border ${SOURCE_COLORS[src] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}
            >
              {src}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAlertClick}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            hasAlertsForPair(decodedPair) ? 'text-amber-400 hover:text-amber-300' : 'text-gray-500 hover:text-gray-300'
          }`}
          aria-label="Set price alert"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
          {hasAlertsForPair(decodedPair) ? 'Alert set' : 'Set price alert'}
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Price History</h2>
        <PriceChart
          data={history}
          loading={historyLoading}
          pair={decodedPair}
        />
      </div>

      <AlertModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        alert={alerts.find((a) => a.assetPair === decodedPair) ?? null}
        defaultAssetPair={decodedPair}
        onDelete={
          alerts.find((a) => a.assetPair === decodedPair)
            ? () => {
                const existing = alerts.find((a) => a.assetPair === decodedPair)
                if (existing) removeAlert(existing.id)
                setModalOpen(false)
              }
            : undefined
        }
      />
    </div>
  )
}
