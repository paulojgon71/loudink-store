import { useState, useEffect } from 'react';

export default function PopupDiscount() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [code, setCode] = useState('');

  useEffect(() => {
    // Não mostrar se já subscreveu
    const subscribed = localStorage.getItem('loudink_subscribed');
    if (subscribed) return;

    // Mostrar após 8 segundos
    const timer = setTimeout(() => {
      setVisible(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.success) {
        setCode(data.code);
        setStatus('success');
        localStorage.setItem('loudink_subscribed', 'true');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem('loudink_subscribed', 'dismissed');
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#111',
        border: '1px solid #333',
        maxWidth: '440px',
        width: '100%',
        padding: '40px',
        position: 'relative',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* Botão fechar */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: '20px',
            cursor: 'pointer',
            lineHeight: 1
          }}
        >✕</button>

        {status !== 'success' ? (
          <>
            <p style={{
              color: '#999',
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>Wear The Noise</p>

            <h2 style={{
              color: '#fff',
              fontSize: '24px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '12px',
              lineHeight: 1.2
            }}>10% de desconto<br />na primeira compra</h2>

            <p style={{
              color: '#aaa',
              fontSize: '14px',
              marginBottom: '28px',
              lineHeight: 1.6
            }}>
              Subscreve e recebe o teu código de desconto imediatamente.
            </p>

            <input
              type="email"
              placeholder="O teu email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#222',
                border: '1px solid #444',
                color: '#fff',
                fontSize: '14px',
                marginBottom: '12px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: '14px',
                background: '#fff',
                color: '#000',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: status === 'loading' ? 'wait' : 'pointer'
              }}
            >
              {status === 'loading' ? 'A enviar...' : 'Obter desconto'}
            </button>

            {status === 'error' && (
              <p style={{ color: '#e55', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
                Erro ao processar. Tenta novamente.
              </p>
            )}

            <p style={{
              color: '#555',
              fontSize: '11px',
              marginTop: '16px',
              textAlign: 'center'
            }}>
              Sem spam. Podes cancelar a qualquer momento.
            </p>
          </>
        ) : (
          <>
            <p style={{
              color: '#999',
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>Obrigado 🤘</p>

            <h2 style={{
              color: '#fff',
              fontSize: '22px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}>O teu código</h2>

            <p style={{
              color: '#aaa',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              Enviámos também o código para o teu email.
            </p>

            <div style={{
              background: '#222',
              border: '1px solid #555',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <span style={{
                fontSize: '26px',
                fontWeight: 'bold',
                letterSpacing: '6px',
                color: '#fff'
              }}>{code}</span>
            </div>

            <button
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '14px',
                background: '#fff',
                color: '#000',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              Ver Coleção
            </button>
          </>
        )}
      </div>
    </div>
  );
}