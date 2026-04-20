import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { orderNumber, customerName, customerEmail, customerPhone, shippingAddress, shippingCity, shippingZip, items, total } = req.body;

  const itemsHtml = items.map(i =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #333">${i.band} — ${i.tour}</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:center">Tam. ${i.size}</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:center">${i.qty}</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:right">${(i.price * i.qty).toFixed(2)}€</td>
    </tr>`
  ).join('');

  try {
    // Email para ti (notificação)
    await resend.emails.send({
      from: 'Loudink <onboarding@resend.dev>',
      to: 'paulojgon71@gmail.com',
      subject: `Nova encomenda ${orderNumber}`,
      html: `
        <div style="font-family:monospace;background:#0a0a0a;color:#e8e0d0;padding:32px">
          <h2 style="color:#cc2200">Nova Encomenda — ${orderNumber}</h2>
          <p><b>Cliente:</b> ${customerName}</p>
          <p><b>Email:</b> ${customerEmail}</p>
          <p><b>Telefone:</b> ${customerPhone}</p>
          <p><b>Morada:</b> ${shippingAddress}, ${shippingCity} ${shippingZip}</p>
          <table style="width:100%;margin-top:16px;border-collapse:collapse">
            <thead>
              <tr style="color:#cc2200">
                <th style="text-align:left;padding:8px">Produto</th>
                <th style="padding:8px">Tamanho</th>
                <th style="padding:8px">Qtd</th>
                <th style="text-align:right;padding:8px">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="margin-top:16px;font-size:18px"><b>Total: ${total.toFixed(2)}€</b></p>
        </div>
      `
    });

    // Email para o cliente (confirmação)
    await resend.emails.send({
      from: 'Loudink <onboarding@resend.dev>',
      to: customerEmail,
      subject: `Confirmação de encomenda ${orderNumber}`,
      html: `
        <div style="font-family:monospace;background:#0a0a0a;color:#e8e0d0;padding:32px">
          <h2 style="color:#cc2200">Obrigado, ${customerName}!</h2>
          <p>Recebemos a tua encomenda <b>${orderNumber}</b>.</p>
          <p style="margin-top:16px">Assim que confirmarmos o pagamento via MB Way, enviamos a tua t-shirt para:</p>
          <p style="margin-top:8px">${shippingAddress}, ${shippingCity} ${shippingZip}</p>
          <table style="width:100%;margin-top:16px;border-collapse:collapse">
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="margin-top:16px;font-size:18px"><b>Total: ${total.toFixed(2)}€</b></p>
          <p style="margin-top:32px;color:#666;font-size:12px">Loudink — loudink.ink</p>
        </div>
      `
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao enviar email' });
  }
}