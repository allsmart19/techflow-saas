// api/reset-password.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Missing email or newPassword' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
  }

  try {
    // Listar todos os usuários do Auth (paginação não necessária para poucos usuários)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    // Encontrar o usuário pelo e-mail
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado no sistema de autenticação' });
    }

    // Atualizar a senha
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });
    if (updateError) throw updateError;

    return res.status(200).json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}