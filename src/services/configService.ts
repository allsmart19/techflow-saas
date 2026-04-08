// src/services/configService.ts
import { supabase } from '../lib/supabase'

export interface ConfigLoja {
  id: number
  nome_loja: string
  logo_url: string | null
}

export async function getConfigLoja(): Promise<ConfigLoja | null> {
  try {
    const { data, error } = await supabase
      .from('config_loja')
      .select('*')
      .single()
    
    if (error) {
      console.error('Erro ao carregar config:', error)
      // Retornar configuração padrão se não encontrar
      return { id: 1, nome_loja: 'TechFlow', logo_url: null }
    }
    
    return data
  } catch (error) {
    console.error('Erro:', error)
    return { id: 1, nome_loja: 'TechFlow', logo_url: null }
  }
}

export async function updateConfigLoja(nome_loja: string, logo_url: string | null): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('config_loja')
      .upsert({
        id: 1,
        nome_loja,
        logo_url
      })
    
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