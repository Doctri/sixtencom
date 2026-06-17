import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <header style={{ borderBottom: "1px solid var(--border)", padding: "20px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: "1.25rem" }}>Sixtencom</strong>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link className="btn btn-secondary" href="/login">
              Ingresar
            </Link>
            <Link className="btn btn-primary" href="/register">
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <section className="container" style={{ padding: "72px 0 48px" }}>
        <p style={{ color: "var(--brand)", fontWeight: 700, marginBottom: 12 }}>Colombia · DIAN</p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1, margin: "0 0 16px" }}>
          Ventas, POS e inventario con facturación legal
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 680, fontSize: "1.1rem", lineHeight: 1.6 }}>
          Sixtencom es tu sistema de ventas para negocios colombianos. Caja, productos, clientes,
          reportes y facturación electrónica DIAN en un solo lugar.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          <Link className="btn btn-primary" href="/register">
            Empezar gratis
          </Link>
          <Link className="btn btn-secondary" href="/login">
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 64 }}>
        <div className="grid-2">
          <article className="card">
            <h3>POS rápido</h3>
            <p style={{ color: "var(--muted)" }}>Vende en mostrador con caja, descuentos y medios de pago.</p>
          </article>
          <article className="card">
            <h3>Facturación DIAN</h3>
            <p style={{ color: "var(--muted)" }}>Preparado para DEE POS, factura electrónica y documentos legales.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
