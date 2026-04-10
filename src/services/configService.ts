// src/services/configService.ts
import { supabase } from '../lib/supabase';

export interface ConfigLoja {
  user_id: number;
  nome_loja: string;
  logo_url: string | null;
}

export async function getConfigLoja(): Promise<ConfigLoja | null> {
  try {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) return null;

    const { data, error } = await supabase
      .from('config_loja')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Se não existir configuração, criar uma padrão
      if (error.code === 'PGRST116') {
        const defaultConfig = {
          user_id: user.id,
          nome_loja: 'TechFlow',
          logo_url: null
        };
        await supabase.from('config_loja').insert([defaultConfig]);
        return defaultConfig;
      }
      console.error('Erro ao carregar config:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
}

export async function updateConfigLoja(nome_loja: string, logo_url: string | null): Promise<boolean> {
  try {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) return false;

    const { error } = await supabase
      .from('config_loja')
      .upsert({
        user_id: user.id,
        nome_loja,
        logo_url
      }, { onConflict: 'user_id' });
    
    if (error) {
      console.error('Erro ao salvar config:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro:', error);
    return false;
  }
}