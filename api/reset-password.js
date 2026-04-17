// api/reset-password.js
import { createClient } from '@supabase/supabase-js';

// 🔥 CONFIGURAÇÃO DO SUPABASE
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 🔥 LOG PARA DEBUG
  console.log('🔔 Função reset-password chamada');
  console.log('📌 Método:', req.method);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTORS request respondido');
    return res.status(200).end();
  }

  // Verificar método
  if (req.method !== 'POST') {
    console.log('❌ Método não permitido:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, newPassword } = req.body;
    
    console.log('📧 Email recebido:', email);
    console.log('🔑 Nova senha (tamanho):', newPassword?.length);

    if (!email || !newPassword) {
      console.log('❌ Campos faltando');
      return res.status(400).json({ error: 'Missing email or newPassword' });
    }

    if (newPassword.length < 6) {
      console.log('❌ Senha muito curta');
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Buscar usuários no Auth
    console.log('🔍 Buscando usuários no Auth...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }

    console.log(`📊 Total de usuários encontrados: ${users?.length || 0}`);

    // Encontrar usuário pelo email
    const user = users?.find(u => u.email === email);
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(404).json({ error: 'Usuário não encontrado no sistema de autenticação' });
    }

    console.log('✅ Usuário encontrado:', user.id);

    // Atualizar senha
    console.log('🔐 Atualizando senha...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });
    
    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    console.log('✅ Senha atualizada com sucesso!');
    return res.status(200).json({ success: true, message: 'Senha alterada com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}