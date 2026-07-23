import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { business: true },
  });

  if (!user) redirect("/login");

  const [productCount, customerCount, invoiceCount] = await Promise.all([
    prisma.product.count({ where: { businessId: session.businessId } }),
    prisma.customer.count({ where: { businessId: session.businessId } }),
    prisma.invoice.count({ where: { businessId: session.businessId } }),
  ]);

  const receivable = await prisma.invoice.aggregate({
    where: { businessId: session.businessId, status: { in: ["OPEN", "PARTIAL"] } },
    _sum: { totalCents: true, paidCents: true },
  });
  const receivableCents = (receivable._sum.totalCents ?? 0) - (receivable._sum.paidCents ?? 0);
  const receivableLabel = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(receivableCents / 100);

  const activeProducts = await prisma.product.count({
    where: { businessId: session.businessId, status: "ACTIVE" },
  });

  return (
    <main className="page-shell">
      <div className="container">
        <div className="card" style={{ padding: 32 }}>
          <div className="page-header">
            <div>
              <p className="eyebrow">SIXTENCOM</p>
              <h1>Dashboard</h1>
            </div>
            <LogoutButton />
          </div>

          <div className="page-nav">
            <Link className="active" href="/dashboard">
              Inicio
            </Link>
            <Link href="/products">Catálogo</Link>
            <Link href="/customers">Clientes</Link>
            <Link href="/invoices">Facturas</Link>
          </div>

          <div className="grid-2">
            <div className="card" style={{ padding: 24 }}>
              <h3>Tu empresa</h3>
              <div style={{ marginTop: 16 }}>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Nombre comercial</p>
                <strong style={{ fontSize: "1.1rem" }}>{user.business.tradeName}</strong>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 8 }}>
                  NIT {user.business.nit}-{user.business.verificationDigit}
                </p>
              </div>
              <div style={{ marginTop: 16 }}>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Régimen tributario</p>
                <strong>{user.business.taxRegime}</strong>
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3>Tu cuenta</h3>
              <div style={{ marginTop: 16 }}>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Usuario</p>
                <strong style={{ fontSize: "1.1rem" }}>{user.fullName}</strong>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 8 }}>{user.role}</p>
              </div>
              <div style={{ marginTop: 16 }}>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Correo</p>
                <strong style={{ fontSize: "0.95rem" }}>{user.email}</strong>
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ marginTop: 24 }}>
            <article className="metric">
              <span>Productos</span>
              <strong style={{ fontSize: "2rem" }}>{productCount}</strong>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                {activeProducts} activos
              </p>
            </article>

            <article className="metric">
              <span>Clientes</span>
              <strong style={{ fontSize: "2rem" }}>{customerCount}</strong>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                registrados
              </p>
            </article>

            <article className="metric metric-warning">
              <span>Por cobrar</span>
              <strong style={{ fontSize: "1.6rem" }}>{receivableLabel}</strong>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                {invoiceCount} facturas
              </p>
            </article>
          </div>
        </div>
      </div>
    </main>
  );
}
