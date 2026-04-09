// src/services/assinaturaService.ts
import { supabase } from '../lib/supabase';
import { getAssinaturaAtiva } from './stripeService';

export async function isAcessoLiberado(userId: number): Promise<boolean> {
  try {
    // Primeiro, verifica no Supabase se há assinatura ativa
    const { data: assinatura, error } = await supabase
      .from('assinaturas')
      .select('status, data_expiracao')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !assinatura) {
      // Se não encontrar no banco, tenta buscar do Stripe (para sincronizar)
      const stripeAssinatura = await getAssinaturaAtiva(userId);
      if (!stripeAssinatura) return false;
      
      // Verifica se a data de expiração é futura
      const expiracao = new Date(stripeAssinatura.data_expiracao);
      return expiracao > new Date();
    }

    // Verifica se a data de expiração é futura
    const expiracao = new Date(assinatura.data_expiracao);
    return expiracao > new Date();
  } catch (error) {
    console.error('Erro ao verificar acesso liberado:', error);
    return false;
  }
}

export { getAssinaturaAtiva };