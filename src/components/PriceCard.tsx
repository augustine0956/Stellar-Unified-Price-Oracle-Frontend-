import { memo } from 'react'
import type { PriceData, PriceSyncState } from '../types'
import { formatPrice, timeAgo } from '../utils/format'

const SOURCE_COLORS: Record<string, string> = {
  chainlink: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  redstone: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  band: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  reflector: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
}

interface PriceCardProps {
  price: PriceData
  onClick?: () => void
  isLive?: boolean
  isStale?: boolean
  syncState?: PriceSyncState
  flashVersion?: number
  isValidating?: boolean
  hasAlert?: boolean
  onAlertClick?: (e: React.MouseEvent) => void
}

export const PriceCard = memo(function PriceCard({
  price,
  onClick,
  isLive,
  isStale,
  syncState,
  flashVersion = 0,
  isValidating,
  hasAlert,
  onAlertClick,
}: PriceCardProps) {
  const confidencePct = (price.confidence * 100).toFixed(1)
  const optimistic = syncState === 'optimistic'
  const confirmed = syncState === 'confirmed'
  const rolledBack = syncState === 'rollback'
  const cardClassName = [
    'w-full text-left bg-gray-900 border rounded-xl p-5 hover:bg-gray-900/80 transition-all shadow-lg shadow-black/20 cursor-pointer',
    optimistic ? 'border-amber-500/60 ring-1 ring-amber-500/25' : 'border-gray-800 hover:border-gray-700',
    confirmed ? 'border-emerald-500/60 ring-1 ring-emerald-500/25' : '',
    rolledBack ? 'border-rose-500/60 ring-1 ring-rose-500/25' : '',
    isStale ? 'opacity-80' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      role="button"
      tabIndex={0}
      className={cardClassName}
      aria-label={`View details for ${price.assetPair}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-100">{price.assetPair}</h3>
        <div className="flex items-center gap-2">
          {hasAlert && (
            <span
              className="w-2 h-2 rounded-full bg-amber-400"
              role="status"
              aria-label="Active alert"
            />
          )}
          {isLive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" role="status" aria-label="Live data" />}
        </div>
      </div>

      <div
        key={`${syncState ?? 'rest'}-${flashVersion}`}
        className={`text-3xl font-bold text-gray-900 dark:text-white mb-3 font-mono tracking-tight transition-colors duration-700 ${
          confirmed ? 'text-emerald-300' : rolledBack ? 'text-rose-300' : ''
        }`}
      >
        ${formatPrice(price.price)}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-3">
        <span>Updated {timeAgo(price.timestamp)}</span>
        <span className="text-cyan-600 dark:text-cyan-400">{confidencePct}% confidence</span>
      </div>

      {(optimistic || rolledBack || isValidating) && (
        <div className="flex items-center gap-2 mb-3 text-[11px] font-medium">
          {optimistic && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Optimistic update
            </span>
          )}
          {rolledBack && (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              REST corrected
            </span>
          )}
          {isValidating && !optimistic && (
            <span className="text-gray-500">Revalidating</span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {price.sources.map((src) => (
          <span
            key={src}
            className={`px-2 py-0.5 rounded text-xs font-medium border ${SOURCE_COLORS[src] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}
          >
            {src}
          </span>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-800">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAlertClick?.(e)
          }}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${hasAlert ? 'text-amber-400 hover:text-amber-300' : 'text-gray-500 hover:text-gray-300'}`}
          aria-label={`Set alert for ${price.assetPair}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
          {hasAlert ? 'Alert set' : 'Set alert'}
        </button>
      </div>
    </div>
  )
})
