import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Verifica se o email já está registado
  const { data: existing } = await supabase
    .from('email_subscribers')
    .select('email')
    .eq('email', email)
    .single();

  if (existing) {
    return res.status(200).json({ 
      success: true, 
      code: 'WELCOME10',
      message: 'already_subscribed'
    });
  }

  // Regista o email
  const { error: insertError } = await supabase
    .from('email_subscribers')
    .insert([{ email, code: 'WELCOME10' }]);

  if (insertError) {
    console.error('Supabase error:', insertError);
    return res.status(500).json({ error: 'Erro ao registar email' });
  }

  // Envia email com o código
  const { error: emailError } = await resend.emails.send({
    from: 'Loudink <hello@loudink.ink>',
    to: email,
    subject: 'O teu desconto Loudink está aqui 🤘',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 40px;">
        <h1 style="font-size: 32px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 8px;">LOUDINK</h1>
        <p style="color: #999; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 40px;">Wear The Noise</p>
        
        <h2 style="font-size: 20px; margin-bottom: 16px;">O teu código de desconto</h2>
        <p style="color: #ccc; margin-bottom: 24px;">Obrigado por subscreveres. Aqui está o teu desconto de 10% na primeira compra:</p>
        
        <div style="background: #222; border: 1px solid #444; padding: 20px; text-align: center; margin-bottom: 32px;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #fff;">WELCOME10</span>
        </div>
        
        <p style="color: #ccc; margin-bottom: 32px;">Usa este código no checkout para obteres 10% de desconto na tua primeira encomenda.</p>
        
        <a href="https://loudink.ink" style="background: #fff; color: #000; padding: 14px 32px; text-decoration: none; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; font-size: 14px;">Ver Coleção</a>
        
        <p style="color: #555; font-size: 12px; margin-top: 40px;">© Loudink. Todos os direitos reservados.</p>
      </div>
    `
  });

  if (emailError) {
    console.error('Resend error:', emailError);
    // Mesmo com erro no email, o registo foi feito
    return res.status(200).json({ 
      success: true, 
      code: 'WELCOME10',
      message: 'subscribed'
    });
  }

  return res.status(200).json({ 
    success: true, 
    code: 'WELCOME10',
    message: 'subscribed'
  });
}