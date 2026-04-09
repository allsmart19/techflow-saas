// src/services/assinaturaService.ts
import { supabase } from '../lib/supabase';
import { getAssinaturaAtiva } from './stripeService';

export async function isAcessoLiberado(userId: number): Promise<boolean> {
  try {
    const assinatura = await getAssinaturaAtiva(userId);
    if (!assinatura) return false;
    const expiracao = new Date(assinatura.data_expiracao);
    return expiracao > new Date();
  } catch (error) {
    console.error('Erro ao verificar acesso liberado:', error);
    return false;
  }
}

export { getAssinaturaAtiva };