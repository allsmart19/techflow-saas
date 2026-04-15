// src/components/TrialBanner.tsx
import { Clock } from "lucide-react"
import { Link } from "react-router-dom"

interface TrialBannerProps {
  trialEnd: string
  daysLeft?: number
}

export function TrialBanner({ trialEnd, daysLeft }: TrialBannerProps) {
  const endDate = new Date(trialEnd)
  const now = new Date()
  const calculatedDaysLeft = daysLeft !== undefined ? daysLeft : Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (calculatedDaysLeft <= 0) return null

  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 mb-6 text-white">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">
            🎉 Você está no período de <strong>teste grátis</strong>! Faltam <strong>{calculatedDaysLeft} dia(s)</strong> para o fim.
          </span>
        </div>
        <Link
          to="/assinatura"
          className="bg-white text-purple-600 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition"
        >
          Fazer Upgrade Agora
        </Link>
      </div>
    </div>
  )
}