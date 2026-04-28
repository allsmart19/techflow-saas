// src/services/permissaoService.ts
import { supabase } from '../lib/supabase';

export interface Permissoes {
  dashboard?: boolean;
  pedidos?: boolean;
  consertos?: boolean;
  novo_pedido?: boolean;
  filtros?: boolean;
  relatorios?: boolean;
  usuarios?: boolean;
  assinatura?: boolean;
  ajustes?: boolean;
  ordens_servico?: boolean;
  clientes?: boolean;
  estoque?: boolean;
}

export const todasPermissoes: (keyof Permissoes)[] = [
  'dashboard', 'pedidos', 'consertos', 'novo_pedido',
  'filtros', 'relatorios', 'usuarios', 'assinatura', 'ajustes', 'ordens_servico', 'clientes', 'estoque'
];

export async function getPermissoesUsuario(userId: number): Promise<Permissoes> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('role, permissoes, loja_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return {};
  }

  // Master (super admin) tem todas as permissões
  if (data.role === 'master') {
    return todasPermissoes.reduce((acc, p) => ({ ...acc, [p]: true }), {});
  }

  // Administrador da loja tem todas as permissões
  if (data.role === 'admin_loja') {
    return todasPermissoes.reduce((acc, p) => ({ ...acc, [p]: true }), {});
  }

  // Técnico: retorna permissões salvas ou permissões padrão limitadas
  if (data.permissoes && Object.keys(data.permissoes).length > 0) {
    return data.permissoes;
  }

  // Permissões padrão para técnico
  return {
    dashboard: true,
    pedidos: true,
    consertos: true,
    novo_pedido: true,
    filtros: true,
    relatorios: true,
    usuarios: false,
    assinatura: false,
    ajustes: false,
    ordens_servico: true,
    clientes: true,
    estoque: true
  };
}

export async function hasPermissao(userId: number, permissao: keyof Permissoes): Promise<boolean> {
  const permissoes = await getPermissoesUsuario(userId);
  return permissoes[permissao] === true;
}

export async function atualizarPermissoes(userId: number, permissoes: Permissoes) {
  const { error } = await supabase
    .from('usuarios')
    .update({ permissoes })
    .eq('id', userId);

  if (error) throw error;
  return true;
}

export async function getUsuariosDaLoja(lojaId: number) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, username, email, role, ativo, permissoes, comissao_percentual')
    .eq('loja_id', lojaId)
    .order('username');

  if (error) throw error;
  return data;
}
