// src/services/configService.ts
import { supabase } from '../lib/supabase';

export interface ConfigLoja {
  user_id: number;
  loja_id: number;
  nome_loja: string;
  logo_url: string | null;
  endereco: string | null;
  telefone: string | null;
  cnpj: string | null;
  cidade: string | null;
}

export async function getConfigLoja(): Promise<ConfigLoja | null> {
  try {
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user) return null

    // Primeiro, obter a loja_id do usuário logado
    const { data: userInfo, error: userError } = await supabase
      .from("usuarios")
      .select("loja_id")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Erro ao obter loja_id do usuário:", userError)
      return null
    }

    const lojaId = userInfo?.loja_id || 1

    // Buscar configuração da loja pela loja_id
    const { data, error } = await supabase
      .from('config_loja')
      .select('*')
      .eq('loja_id', lojaId)
      .single()

    if (error) {
      // Se não existir configuração para esta loja, criar uma padrão
      if (error.code === 'PGRST116') {
        const defaultConfig = {
          loja_id: lojaId,
          nome_loja: 'Sua Loja',
          logo_url: null,
          endereco: null,
          telefone: null,
          cnpj: null,
          cidade: null
        }
        const { error: insertError } = await supabase
          .from('config_loja')
          .insert([defaultConfig])
        
        if (insertError) {
          console.error("Erro ao criar configuração padrão:", insertError)
          return { ...defaultConfig, user_id: user.id }
        }
        return { ...defaultConfig, user_id: user.id }
      }
      console.error('Erro ao carregar config:', error)
      return null
    }
    
    return { ...data, user_id: user.id }
  } catch (error) {
    console.error('Erro:', error)
    return null
  }
}

export async function updateConfigLoja(config: Partial<ConfigLoja>): Promise<boolean> {
  try {
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user) return false

    // Obter a loja_id do usuário logado
    const { data: userInfo, error: userError } = await supabase
      .from("usuarios")
      .select("loja_id")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Erro ao obter loja_id:", userError)
      return false
    }

    const lojaId = userInfo?.loja_id || 1

    const { error } = await supabase
      .from('config_loja')
      .upsert({
        loja_id: lojaId,
        ...config
      }, { onConflict: 'loja_id' })
    
    if (error) {
      console.error('Erro ao salvar config:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Erro:', error)
    return false
  }
}
