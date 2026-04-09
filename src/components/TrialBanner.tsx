// src/components/TrialBanner.tsx
import { Zap, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TrialBannerProps {
  trialEnd: string; // Data ISO (ex: "2025-05-14T00:00:00.000Z")
}

export function TrialBanner({ trialEnd }: TrialBannerProps) {
  const endDate = new Date(trialEnd);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return null;

  // Define cores e ícone conforme os dias restantes
  let bgClass = "bg-gradient-to-r from-purple-500 to-indigo-600";
  let Icon = Zap;
  let message = `Você está no período de teste grátis! Faltam ${daysLeft} dia(s) para o fim.`;

  if (daysLeft <= 3) {
    bgClass = "bg-gradient-to-r from-orange-500 to-red-600";
    Icon = AlertTriangle;
    message = `⚠️ ATENÇÃO! Seu teste grátis termina em ${daysLeft} dia(s). Assine agora para não perder o acesso.`;
  }

  return (
    <div className={`${bgClass} text-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center gap-3 mb-6`}>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      <Link
        to="/assinatura"
        className="bg-white text-purple-600 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-100 transition whitespace-nowrap"
      >
        Fazer Upgrade
      </Link>
    </div>
  );
}