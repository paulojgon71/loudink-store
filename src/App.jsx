import { useState, useEffect } from "react";
import PopupDiscount from './PopupDiscount';
import { supabase } from "./supabase";

const GrainOverlay = () => (
  <svg style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:9999,opacity:0.035}} xmlns="http://www.w3.org/2000/svg">
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" opacity="1"/>
  </svg>
);

const TshirtIcon = ({ accentColor, imageUrl, bandName }) => (
  <div style={{
    width: "100%", paddingBottom: "100%", position: "relative",
    background: `linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)`,
    overflow: "hidden"
  }}>
    {imageUrl ? (
      <img src={imageUrl} alt={bandName} style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover"
      }}/>
    ) : (
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8
      }}>
        <svg viewBox="0 0 100 80" width="70%" style={{filter: `drop-shadow(0 0 12px ${accentColor}66)`}}>
          <path d="M20,5 L5,20 L20,25 L20,75 L80,75 L80,25 L95,20 L80,5 Q65,15 50,15 Q35,15 20,5 Z"
            fill="#1e1e1e" stroke={accentColor} strokeWidth="1.5"/>
        </svg>
        <div style={{
          fontFamily: "'Courier New', monospace", fontSize: 9,
          color: accentColor, letterSpacing: 3, textTransform: "uppercase", opacity: 0.8
        }}>{bandName}</div>
      </div>
    )}
  </div>
);

export default function LoudinkStore() {
  const [page, setPage] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStyle, setFilterStyle] = useState("All");
  const [filterCollection, setFilterCollection] = useState("All");
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [orderData, setOrderData] = useState({
    name: "", email: "", phone: "", address: "", city: "", zip: ""
  });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountMsg, setDiscountMsg] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (!error) setProducts(data || []);
    setLoading(false);
  };

  const styles = ["All", ...new Set(products.map(p => p.style))];
  const filtered = products.filter(p => {
    const matchCollection = filterCollection === "All" || p.collection === filterCollection;
    const matchStyle = filterStyle === "All" || p.style === filterStyle;
    return matchCollection && matchStyle;
  });

  const addToCart = (product, size, color) => {
    const existing = cart.find(i => i.id === product.id && i.size === size && i.color === color);
    if (existing) {
      setCart(cart.map(i => i.id === product.id && i.size === size && i.color === color ? {...i, qty: i.qty + 1} : i));
    } else {
      setCart([...cart, {...product, size, color, qty: 1}]);
    }
    setCartOpen(true);
  };

  const removeFromCart = (id, size) => setCart(cart.filter(i => !(i.id === id && i.size === size)));
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalWithDiscount = total - (total * discount / 100);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const applyDiscount = () => {
    if (discountCode.toUpperCase() === "WELCOME10") {
      setDiscount(10);
      setDiscountMsg("✓ Código válido — 10% de desconto aplicado");
    } else {
      setDiscount(0);
      setDiscountMsg("✗ Código inválido");
    }
  };

  const placeOrder = async () => {
    const orderNumber = "LDK-" + Date.now().toString().slice(-6);
    const { error } = await supabase.from("orders").insert({
      order_number: orderNumber,
      customer_name: orderData.name,
      customer_email: orderData.email,
      customer_phone: orderData.phone,
      shipping_address: orderData.address,
      shipping_city: orderData.city,
      shipping_zip: orderData.zip,
      items: cart,
      total: totalWithDiscount,
      status: "pending",
      payment_status: "awaiting"
    });

    if (!error) {
      await fetch('/api/send-order-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          customerName: orderData.name,
          customerEmail: orderData.email,
          customerPhone: orderData.phone,
          shippingAddress: orderData.address,
          shippingCity: orderData.city,
          shippingZip: orderData.zip,
          items: cart,
          total: totalWithDiscount
        })
      });
      setOrderPlaced(true);
      setCheckoutStep(3);
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Special+Elite&family=Barlow+Condensed:wght@300;400;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; }
    :root {
      --bg: #0a0a0a; --bg2: #111; --bg3: #161616;
      --red: #cc2200; --gold: #c9a84c;
      --text: #e8e0d0; --muted: #aaa; --border: #2a2a2a;
    }
    .btn-primary {
      background: var(--red); color: #fff; border: none; cursor: pointer;
      font-family: 'Oswald', sans-serif; font-weight: 600; letter-spacing: 2px;
      text-transform: uppercase; transition: all 0.2s;
      padding: 14px 28px; font-size: 13px;
    }
    .btn-primary:hover { background: #e02800; transform: translateY(-1px); }
    .btn-outline {
      background: transparent; color: var(--text); border: 1px solid var(--border);
      cursor: pointer; font-family: 'Barlow Condensed', sans-serif;
      letter-spacing: 2px; text-transform: uppercase;
      transition: all 0.2s; padding: 10px 20px; font-size: 12px;
    }
    .btn-outline:hover { border-color: var(--red); color: var(--red); }
    .product-card {
      background: var(--bg2); border: 1px solid var(--border);
      cursor: pointer; transition: all 0.3s; overflow: hidden;
    }
    .product-card:hover { border-color: var(--red); transform: translateY(-4px); box-shadow: 0 8px 32px rgba(204,34,0,0.15); }
    .size-btn {
      padding: 8px 14px; border: 1px solid var(--border);
      background: #1a1a1a; color: #e8e0d0; cursor: pointer;
      font-family: 'Barlow Condensed', sans-serif; letter-spacing: 1px;
      font-size: 13px; transition: all 0.2s;
    }
    .size-btn:hover { border-color: var(--text); color: var(--text); }
    .size-btn.active { border-color: var(--red); color: var(--red); background: rgba(204,34,0,0.1); }
    .collection-card {
      background: var(--bg2); border: 1px solid var(--border);
      cursor: pointer; transition: all 0.3s; overflow: hidden;
      position: relative;
    }
    .collection-card:hover { border-color: var(--red); transform: translateY(-4px); box-shadow: 0 8px 32px rgba(204,34,0,0.2); }
    input { width: 100%; padding: 12px 16px; background: var(--bg3); border: 1px solid var(--border);
      color: var(--text); font-family: 'Barlow Condensed', sans-serif;
      font-size: 14px; letter-spacing: 0.5px; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: var(--red); }
    input::placeholder { color: var(--muted); }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--red); }
  `;

  const Header = () => (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(10,10,10,0.95)", backdropFilter: "blur(10px)",
      borderBottom: "1px solid #1a1a1a", padding: "0 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between", height: 64
    }}>
      <div onClick={() => setPage("home")} style={{cursor:"pointer", display:"flex", alignItems:"center"}}>
        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:26,letterSpacing:-1,color:"#e8e0d0",fontStyle:"italic"}}>LOUD</span>
        <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:26,letterSpacing:-1,color:"#cc2200",fontStyle:"italic"}}>INK</span>
      </div>
      <nav style={{display:"flex", gap:32, alignItems:"center"}}>
        {[["home","Início"],["collections","Coleções"],["shop","Loja"]].map(([p,l]) => (
          <span key={p} onClick={() => setPage(p)} style={{
            fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, letterSpacing:3,
            textTransform:"uppercase", color: page===p ? "#cc2200" : "#888", cursor:"pointer"
          }}>{l}</span>
        ))}
      </nav>
      <button onClick={() => setCartOpen(true)} style={{
        background:"transparent", border:"1px solid #2a2a2a", color:"#e8e0d0",
        cursor:"pointer", padding:"8px 16px", fontFamily:"'Barlow Condensed',sans-serif",
        fontSize:12, letterSpacing:2, display:"flex", alignItems:"center", gap:8
      }}>
        🛒 {cartCount > 0 && (
          <span style={{background:"#cc2200",color:"#fff",borderRadius:"50%",width:18,height:18,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
            {cartCount}
          </span>
        )}
      </button>
    </header>
  );

  const collectionsData = [
    { name: "Todas", value: "All", description: "39 designs · Todas as coleções", color: "#cc2200", emoji: "🔥" },
    { name: "Metal & Rock", value: "Metal & Rock", description: "19 designs · Heavy metal, gothic, doom", color: "#cc2200", emoji: "🤘" },
    { name: "Surf & Skate", value: "Surf & Skate", description: "10 designs · California vibes", color: "#00897B", emoji: "🏄" },
    { name: "Americana", value: "Americana", description: "10 designs · Route 66, muscle cars", color: "#8B4513", emoji: "🇺🇸" },
  ];

  const CollectionsPage = () => (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"80px 24px"}}>
      <div style={{marginBottom:64,textAlign:"center"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,letterSpacing:8,
          color:"#cc2200",textTransform:"uppercase",marginBottom:16}}>Loudink</div>
        <h1 style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:64,
          color:"#e8e0d0",fontStyle:"italic",lineHeight:0.9,marginBottom:16}}>Coleções</h1>
        <p style={{fontFamily:"'Special Elite',serif",fontSize:16,color:"#555",letterSpacing:2}}>
          Fictional Legends. Real Style.
        </p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:2}}>
        {collectionsData.map(col => (
          <div key={col.value} className="collection-card"
            onClick={() => {
              setFilterCollection(col.value);
              setFilterStyle("All");
              setPage("shop");
            }}>
            <div style={{
              height:200, display:"flex", alignItems:"center", justifyContent:"center",
              background:`linear-gradient(135deg, #0d0d0d 0%, ${col.color}22 100%)`,
              borderBottom:`1px solid ${col.color}44`, fontSize:80
            }}>
              {col.emoji}
            </div>
            <div style={{padding:"24px 28px"}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:28,
                color:"#e8e0d0",fontStyle:"italic",marginBottom:8}}>{col.name}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,
                color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>{col.description}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,
                color:col.color,letterSpacing:3,textTransform:"uppercase"}}>Ver Coleção →</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const HomePage = () => (
    <div>
      <div style={{
        minHeight:"90vh", display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative", overflow:"hidden",
        background:"linear-gradient(180deg, #0a0a0a 0%, #110500 100%)"
      }}>
        <div style={{position:"absolute",inset:0,
          backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(204,34,0,0.03) 40px,rgba(204,34,0,0.03) 41px)",
          pointerEvents:"none"}}/>
        <div style={{textAlign:"center", maxWidth:800, padding:"0 24px", position:"relative", zIndex:1}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,letterSpacing:8,
            color:"#cc2200",marginBottom:24,textTransform:"uppercase"}}>Est. 2025 · Portugal</div>
          <div style={{marginBottom:16,lineHeight:0.9}}>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
              fontSize:"clamp(80px,18vw,160px)",letterSpacing:-4,color:"#e8e0d0",fontStyle:"italic",lineHeight:0.85}}>LOUD</div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,
              fontSize:"clamp(80px,18vw,160px)",letterSpacing:-4,color:"#cc2200",fontStyle:"italic",lineHeight:0.85}}>INK</div>
          </div>
          <div style={{fontFamily:"'Special Elite',serif",fontSize:"clamp(14px,3vw,18px)",
            color:"#666",letterSpacing:4,marginBottom:48,textTransform:"uppercase"}}>Wear The Noise</div>
          <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn-primary" onClick={() => setPage("collections")}
              style={{fontSize:14,padding:"16px 40px",letterSpacing:3}}>Ver Coleção</button>
            <button className="btn-outline" onClick={() => { setFilterCollection("All"); setPage("shop"); }}>
              {products.length} Designs Disponíveis
            </button>
          </div>
        </div>
      </div>

      <div style={{padding:"80px 24px", maxWidth:1200, margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:48}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,letterSpacing:6,
              color:"#cc2200",textTransform:"uppercase",marginBottom:8}}>Destaques</div>
            <h2 style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:42,
              color:"#e8e0d0",fontStyle:"italic"}}>Fictional Legends.<br/>Real Style.</h2>
          </div>
          <button className="btn-outline" onClick={() => setPage("collections")}>Ver Coleções →</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:2}}>
          {products.slice(0,4).map(p => (
            <div key={p.id} className="product-card"
              onClick={() => { setSelectedProduct(p); setSelectedSize(""); setSelectedColor(""); setPage("product"); }}>
              <TshirtIcon accentColor={p.accent_color} imageUrl={p.image_url} bandName={p.band}/>
              <div style={{padding:"16px 20px"}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:18,
                  color:"#e8e0d0",fontStyle:"italic",marginBottom:2}}>{p.band}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,
                  color:p.accent_color,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>
                  {p.style} · {p.year}</div>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,
                  color:"#e8e0d0",fontWeight:600}}>€{Number(p.price).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{borderTop:"1px solid #1a1a1a",borderBottom:"1px solid #1a1a1a",
        background:"#0d0d0d",padding:"40px 24px"}}>
        <div style={{maxWidth:1000,margin:"0 auto",
          display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
          gap:40,textAlign:"center"}}>
          {[["🖨️","Impressão DTF","Alta qualidade em tecido"],
            ["📦","Envio Portugal","CTT Expresso 2-3 dias"],
            ["🎨","Design Original","39 designs fictícios únicos"],
            ["💳","Pagamento MB Way","Rápido e seguro"]].map(([icon,title,sub]) => (
            <div key={title}>
              <div style={{fontSize:28,marginBottom:8}}>{icon}</div>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,color:"#e8e0d0",
                fontWeight:600,marginBottom:4}}>{title}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,
                color:"#555",letterSpacing:1}}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ShopPage = () => (
    <div style={{maxWidth:1300,margin:"0 auto",padding:"60px 24px"}}>
      <div style={{marginBottom:48}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,letterSpacing:6,
          color:"#cc2200",textTransform:"uppercase",marginBottom:8}}>
          {filterCollection === "All" ? "Todos os Designs" : filterCollection}
        </div>
        <h1 style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:52,
          color:"#e8e0d0",fontStyle:"italic"}}>A Coleção</h1>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:40,
        paddingBottom:24,borderBottom:"1px solid #1a1a1a"}}>
        {styles.map(s => (
          <button key={s} onClick={() => setFilterStyle(s)} style={{
            padding:"6px 16px",
            background: filterStyle===s ? "#cc2200" : "transparent",
            border:`1px solid ${filterStyle===s ? "#cc2200" : "#2a2a2a"}`,
            color: filterStyle===s ? "#fff" : "#666",
            cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
            fontSize:11, letterSpacing:2, textTransform:"uppercase", transition:"all 0.2s"
          }}>{s}</button>
        ))}
      </div>
      {loading ? (
        <div style={{textAlign:"center",padding:"80px 0",fontFamily:"'Barlow Condensed',sans-serif",
          color:"#444",letterSpacing:4,fontSize:13,textTransform:"uppercase"}}>A carregar...</div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:2}}>
          {filtered.map(p => (
            <div key={p.id} className="product-card"
              onClick={() => { setSelectedProduct(p); setSelectedSize(""); setSelectedColor(""); setPage("product"); }}>
              <TshirtIcon accentColor={p.accent_color} imageUrl={p.image_url} bandName={p.band}/>
              <div style={{padding:"20px 24px"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,letterSpacing:3,
                  color:p.accent_color,textTransform:"uppercase",marginBottom:4}}>{p.style}</div>
                <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:22,
                  color:"#e8e0d0",fontStyle:"italic",marginBottom:2}}>{p.band}</div>
                <div style={{fontFamily:"'Special Elite',serif",fontSize:11,
                  color:"#555",marginBottom:16}}>{p.tour} · {p.year}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontFamily:"'Oswald',sans-serif",fontSize:22,
                    color:"#e8e0d0",fontWeight:600}}>€{Number(p.price).toFixed(2)}</span>
                  <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,
                    letterSpacing:2,color:"#444",textTransform:"uppercase"}}>Ver →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ProductPage = () => {
    const p = selectedProduct;
    if (!p) return null;
    const sizes = Array.isArray(p.sizes) ? p.sizes : ["S","M","L","XL","XXL"];
    const colors = Array.isArray(p.colors) ? p.colors : ["black"];
    const colorMap = { black:"#1a1a1a", white:"#f0f0f0", grey:"#666666", navy:"#1a2744", bordeaux:"#5c1a1a" };
    const colorLabels = { black:"Preto", white:"Branco", grey:"Cinzento", navy:"Azul Navy", bordeaux:"Bordeaux" };
    return (
      <div style={{maxWidth:1100,margin:"0 auto",padding:"60px 24px"}}>
        <button className="btn-outline" onClick={() => setPage("shop")}
          style={{marginBottom:40,fontSize:11}}>← Voltar à Loja</button>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 400px), 1fr))",gap:32}}>
          <div>
            <div style={{background:"#111",border:"1px solid #1a1a1a",padding:40,
              position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,
                background:`radial-gradient(circle at 50% 50%, ${p.accent_color}15 0%, transparent 70%)`}}/>
              <TshirtIcon accentColor={p.accent_color} imageUrl={p.image_url} bandName={p.band}/>
            </div>
          </div>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,letterSpacing:4,
              color:p.accent_color,textTransform:"uppercase",marginBottom:8}}>{p.style} · {p.year}</div>
            <h1 style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:52,
              color:"#e8e0d0",fontStyle:"italic",lineHeight:0.9,marginBottom:12}}>{p.band}</h1>
            <div style={{fontFamily:"'Special Elite',serif",fontSize:14,color:"#555",
              marginBottom:32,paddingBottom:32,borderBottom:"1px solid #1a1a1a"}}>
              {p.tour} — {p.year}</div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:36,
              color:"#e8e0d0",fontWeight:600,marginBottom:32}}>€{Number(p.price).toFixed(2)}</div>
            <div style={{marginBottom:32}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,letterSpacing:3,
                color:"#555",textTransform:"uppercase",marginBottom:12}}>
                Tamanho {selectedSize && `— ${selectedSize}`}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {sizes.map(s => (
                  <button key={s} className={`size-btn ${selectedSize===s?"active":""}`}
                    onClick={() => setSelectedSize(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:32}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,letterSpacing:3,
                color:"#555",textTransform:"uppercase",marginBottom:12}}>
                Cor {selectedColor && `— ${colorLabels[selectedColor]}`}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {colors.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)} style={{
                    width:32, height:32, borderRadius:"50%",
                    background: colorMap[c],
                    border: selectedColor===c ? "2px solid #cc2200" : "2px solid #333",
                    cursor:"pointer", transition:"all 0.2s",
                    boxShadow: selectedColor===c ? "0 0 0 2px #cc2200" : "none"
                  }} title={colorLabels[c]}/>
                ))}
              </div>
            </div>
            <button className="btn-primary"
              style={{width:"100%",padding:18,fontSize:14,letterSpacing:3,
                opacity:(selectedSize && selectedColor)?1:0.4,
                cursor:(selectedSize && selectedColor)?"pointer":"not-allowed"}}
              onClick={() => { if(selectedSize && selectedColor) addToCart(p, selectedSize, selectedColor); }}>
              {!selectedSize ? "Seleciona um Tamanho" : !selectedColor ? "Seleciona uma Cor" : "Adicionar ao Carrinho"}
            </button>
            <div style={{marginTop:32,padding:20,background:"#0d0d0d",border:"1px solid #1a1a1a"}}>
              {[["Material","100% algodão 180g"],["Impressão","DTF — durável e lavável"],
                ["Envio","CTT Expresso · 2-3 dias úteis"],["Devoluções","Até 14 dias após receção"]].map(([k,v]) => (
                <div key={k} style={{display:"flex",justifyContent:"space-between",
                  padding:"8px 0",borderBottom:"1px solid #161616",fontFamily:"'Barlow Condensed',sans-serif"}}>
                  <span style={{fontSize:12,letterSpacing:1,color:"#444",textTransform:"uppercase"}}>{k}</span>
                  <span style={{fontSize:13,color:"#888"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CartSidebar = () => (
    <div style={{position:"fixed",inset:0,zIndex:200,display:cartOpen?"flex":"none"}}>
      <div onClick={() => setCartOpen(false)} style={{flex:1,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)"}}/>
      <div style={{width:420,background:"#0d0d0d",borderLeft:"1px solid #1a1a1a",
        display:"flex",flexDirection:"column",height:"100%",overflowY:"auto"}}>
        <div style={{padding:"24px 28px",borderBottom:"1px solid #1a1a1a",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:22,
            color:"#e8e0d0",fontStyle:"italic"}}>Carrinho {cartCount>0&&`(${cartCount})`}</span>
          <button onClick={() => setCartOpen(false)} style={{background:"none",border:"none",
            color:"#666",cursor:"pointer",fontSize:20}}>✕</button>
        </div>
        <div style={{flex:1,padding:"24px 28px"}}>
          {cart.length===0 ? (
            <div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Barlow Condensed',sans-serif",
              color:"#444",letterSpacing:2,fontSize:13,textTransform:"uppercase"}}>Carrinho vazio</div>
          ) : cart.map(item => (
            <div key={`${item.id}-${item.size}-${item.color}`} style={{display:"flex",gap:16,padding:"16px 0",
              borderBottom:"1px solid #1a1a1a",alignItems:"center"}}>
              <div style={{width:60,height:60,background:"#161616",
                border:`1px solid ${item.accent_color}33`,flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>👕</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:600,fontSize:16,
                  color:"#e8e0d0",fontStyle:"italic"}}>{item.band}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,
                  color:"#555",letterSpacing:1}}>Tam. {item.size} · {item.color} · Qty {item.qty}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,
                  color:"#e8e0d0"}}>€{(item.price*item.qty).toFixed(2)}</div>
                <button onClick={() => removeFromCart(item.id,item.size)} style={{
                  background:"none",border:"none",color:"#cc2200",cursor:"pointer",
                  fontSize:11,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>Remover</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length>0 && (
          <div style={{padding:"24px 28px",borderTop:"1px solid #1a1a1a"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20,
              paddingBottom:16,borderBottom:"1px solid #1a1a1a"}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,
                letterSpacing:2,color:"#666",textTransform:"uppercase"}}>Total</span>
              <span style={{fontFamily:"'Oswald',sans-serif",fontSize:24,
                color:"#e8e0d0",fontWeight:600}}>€{total.toFixed(2)}</span>
            </div>
            <button className="btn-primary" style={{width:"100%",padding:16}}
              onClick={() => { setCartOpen(false); setPage("checkout"); setCheckoutStep(1); }}>
              Finalizar Encomenda
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const CheckoutPage = () => (
    <div style={{maxWidth:800,margin:"0 auto",padding:"60px 24px"}}>
      <div style={{display:"flex",gap:0,marginBottom:48,borderBottom:"1px solid #1a1a1a",paddingBottom:24}}>
        {["Dados","Confirmação","Pagamento MB Way"].map((s,i) => (
          <div key={s} style={{flex:1,textAlign:"center",fontFamily:"'Barlow Condensed',sans-serif",
            fontSize:12,letterSpacing:2,textTransform:"uppercase",
            color:checkoutStep===i+1?"#cc2200":"#333",
            borderBottom:checkoutStep===i+1?"2px solid #cc2200":"2px solid transparent",
            paddingBottom:8}}>{i+1}. {s}</div>
        ))}
      </div>

      {checkoutStep===1 && (
        <div>
          <h2 style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:32,
            color:"#e8e0d0",fontStyle:"italic",marginBottom:32}}>Os teus dados</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {[["name","Nome completo"],["email","Email"],["phone","Telemóvel (MB Way)"],
              ["address","Morada"],["city","Cidade"],["zip","Código Postal"]].map(([field,label]) => (
              <div key={field} style={{gridColumn:field==="address"?"span 2":"span 1"}}>
                <label style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,
                  letterSpacing:2,color:"#555",textTransform:"uppercase",display:"block",marginBottom:6}}>{label}</label>
                <input value={orderData[field]}
                  onChange={e => setOrderData({...orderData,[field]:e.target.value})}
                  placeholder={label}/>
              </div>
            ))}
          </div>

          {/* Campo de código de desconto */}
          <div style={{marginTop:32,padding:24,background:"#0d0d0d",border:"1px solid #1a1a1a"}}>
            <label style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,
              letterSpacing:2,color:"#555",textTransform:"uppercase",display:"block",marginBottom:12}}>
              Código de Desconto
            </label>
            <div style={{display:"flex",gap:8}}>
              <input
                value={discountCode}
                onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="Ex: WELCOME10"
                style={{flex:1}}
              />
              <button
                onClick={applyDiscount}
                className="btn-outline"
                style={{whiteSpace:"nowrap",padding:"12px 20px"}}
              >
                Aplicar
              </button>
            </div>
            {discountMsg && (
              <p style={{
                fontFamily:"'Barlow Condensed',sans-serif",
                fontSize:13,
                marginTop:10,
                color: discount > 0 ? "#4caf50" : "#cc2200",
                letterSpacing:1
              }}>{discountMsg}</p>
            )}
          </div>

          <button className="btn-primary" style={{marginTop:32,padding:"16px 40px"}}
            onClick={() => setCheckoutStep(2)}>Continuar →</button>
        </div>
      )}

      {checkoutStep===2 && (
        <div>
          <h2 style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:32,
            color:"#e8e0d0",fontStyle:"italic",marginBottom:32}}>Confirmar Encomenda</h2>
          {cart.map(item => (
            <div key={`${item.id}-${item.size}-${item.color}`} style={{display:"flex",justifyContent:"space-between",
              padding:"16px 0",borderBottom:"1px solid #1a1a1a",fontFamily:"'Barlow Condensed',sans-serif"}}>
              <span style={{color:"#e8e0d0",fontSize:16}}>{item.band} — Tam. {item.size} · {item.color} × {item.qty}</span>
              <span style={{color:"#e8e0d0",fontSize:16}}>€{(item.price*item.qty).toFixed(2)}</span>
            </div>
          ))}

          {/* Resumo de desconto */}
          <div style={{padding:"16px 0",borderBottom:"1px solid #1a1a1a"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,
              fontFamily:"'Barlow Condensed',sans-serif"}}>
              <span style={{color:"#666",fontSize:14,letterSpacing:1}}>Subtotal</span>
              <span style={{color:"#e8e0d0",fontSize:14}}>€{total.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div style={{display:"flex",justifyContent:"space-between",
                fontFamily:"'Barlow Condensed',sans-serif"}}>
                <span style={{color:"#4caf50",fontSize:14,letterSpacing:1}}>Desconto ({discount}%)</span>
                <span style={{color:"#4caf50",fontSize:14}}>-€{(total * discount / 100).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div style={{display:"flex",justifyContent:"space-between",padding:"20px 0",marginBottom:32}}>
            <span style={{fontFamily:"'Oswald',sans-serif",fontSize:22,color:"#e8e0d0",fontStyle:"italic"}}>Total</span>
            <span style={{fontFamily:"'Oswald',sans-serif",fontSize:28,color:"#e8e0d0",fontWeight:700}}>
              €{totalWithDiscount.toFixed(2)}
            </span>
          </div>
          <div style={{display:"flex",gap:16}}>
            <button className="btn-outline" onClick={() => setCheckoutStep(1)}>← Voltar</button>
            <button className="btn-primary" style={{flex:1,padding:16}} onClick={placeOrder}>
              Pagar com MB Way
            </button>
          </div>
        </div>
      )}

      {checkoutStep===3 && (
        <div style={{textAlign:"center"}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(204,34,0,0.1)",
            border:"2px solid #cc2200",display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:36,margin:"0 auto 32px"}}>✅</div>
          <h2 style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:32,
            color:"#e8e0d0",fontStyle:"italic",marginBottom:16}}>Encomenda Registada!</h2>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,
            color:"#666",letterSpacing:1,marginBottom:32}}>
            Vais receber um pedido MB Way no número {orderData.phone}.<br/>
            Confirma o pagamento na app MB Way para finalizar.
          </div>
          <button className="btn-primary" onClick={() => { setCart([]); setPage("home"); }}>
            Voltar à Loja
          </button>
        </div>
      )}
    </div>
  );

  const Footer = () => (
    <footer style={{borderTop:"1px solid #1a1a1a",padding:"40px 24px",marginTop:80}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:"flex",
        justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
        <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:20,fontStyle:"italic"}}>
          <span style={{color:"#e8e0d0"}}>LOUD</span><span style={{color:"#cc2200"}}>INK</span>
        </div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,color:"#333",
          letterSpacing:2,textTransform:"uppercase"}}>© 2025 Loudink · Portugal · Wear The Noise</div>
      </div>
    </footer>
  );

  return (
    <div style={{background:"#0a0a0a",minHeight:"100vh",color:"#e8e0d0"}}>
      <style>{css}</style>
      <GrainOverlay />
      <PopupDiscount />
      <Header/>
      {page==="home" && <HomePage/>}
      {page==="collections" && <CollectionsPage/>}
      {page==="shop" && <ShopPage/>}
      {page==="product" && <ProductPage/>}
      {page==="checkout" && CheckoutPage()}
      <CartSidebar/>
      <Footer/>
    </div>
  );
}