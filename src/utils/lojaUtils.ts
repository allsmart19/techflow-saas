// src/utils/lojaUtils.ts
import { supabase } from '../lib/supabase';

export async function getLojaIdByUser(userId: number): Promise<number | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('loja_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Erro ao obter loja_id:', error);
    return null;
  }
  return data.loja_id;
}