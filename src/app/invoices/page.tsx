"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type InvoiceListItem = {
  id: string;
  number: string;
  status: "DRAFT" | "OPEN" | "PARTIAL" | "PAID" | "VOID";
  issueDate: string;
  totalCents: number;
  paidCents: number;
  customer: { id: string; name: string };
  _count: { items: number };
};

const statusLabels: Record<InvoiceListItem["status"], string> = {
  DRAFT: "Borrador",
  OPEN: "Pendiente",
  PARTIAL: "Pago parcial",
  PAID: "Pagada",
  VOID: "Anulada",
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/invoices", { credentials: "same-origin" });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          setError(data?.error ?? "No se pudieron cargar las facturas");
          return;
        }
        setInvoices(data?.invoices ?? []);
      } catch {
        setError("Error de conexión al cargar facturas");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const receivableCents = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.status === "OPEN" || invoice.status === "PARTIAL")
        .reduce((sum, invoice) => sum + (invoice.totalCents - invoice.paidCents), 0),
    [invoices],
  );
  const paidCount = useMemo(() => invoices.filter((invoice) => invoice.status === "PAID").length, [invoices]);

  return (
    <main className="page-shell">
      <div className="container">
        <div className="card" style={{ padding: 32 }}>
          <div className="page-header">
            <div>
              <p className="eyebrow">Ventas</p>
              <h1>Facturas</h1>
            </div>
            <Link className="btn btn-primary" href="/invoices/new">
              Nueva factura
            </Link>
          </div>

          <div className="page-nav">
            <Link href="/dashboard">Inicio</Link>
            <Link href="/products">Catálogo</Link>
            <Link href="/customers">Clientes</Link>
            <Link className="active" href="/invoices">
              Facturas
            </Link>
          </div>

          <div className="grid-3" style={{ marginBottom: 20 }}>
            <article className="metric">
              <span>Facturas</span>
              <strong>{invoices.length}</strong>
            </article>
            <article className="metric">
              <span>Pagadas</span>
              <strong>{paidCount}</strong>
            </article>
            <article className="metric metric-warning">
              <span>Por cobrar</span>
              <strong>{formatCurrency(receivableCents)}</strong>
            </article>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <section className="card">
            <h2>Historial</h2>
            {loading ? (
              <p style={{ color: "var(--muted)" }}>Cargando facturas...</p>
            ) : invoices.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>
                Aún no hay facturas. Crea la primera con el botón &ldquo;Nueva factura&rdquo;.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>
                          <Link href={`/invoices/${invoice.id}`}>{invoice.number}</Link>
                        </td>
                        <td>{invoice.customer.name}</td>
                        <td>{formatDate(invoice.issueDate)}</td>
                        <td>{statusLabels[invoice.status]}</td>
                        <td>{formatCurrency(invoice.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
