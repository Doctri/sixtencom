"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Payment = {
  id: string;
  amountCents: number;
  method: "CASH" | "CARD" | "TRANSFER" | "OTHER";
  reference: string | null;
  paidAt: string;
};

type InvoiceDetail = {
  id: string;
  number: string;
  status: "DRAFT" | "OPEN" | "PARTIAL" | "PAID" | "VOID";
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  customer: { id: string; name: string; documentType: string; documentNumber: string };
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    discountCents: number;
    vatRate: string;
    lineTotalCents: number;
  }[];
  payments: Payment[];
};

const statusLabels: Record<InvoiceDetail["status"], string> = {
  DRAFT: "Borrador",
  OPEN: "Pendiente",
  PARTIAL: "Pago parcial",
  PAID: "Pagada",
  VOID: "Anulada",
};

const methodLabels: Record<Payment["method"], string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/invoices/${params.id}`, { credentials: "same-origin" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "No se pudo cargar la factura");
        return;
      }
      setInvoice(data.invoice);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onPay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/invoices/${params.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          amount: form.get("amount"),
          method: form.get("method"),
          reference: (form.get("reference") as string)?.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "No se pudo registrar el pago");
        return;
      }
      await load();
      event.currentTarget?.reset?.();
    } catch {
      setError("Error de conexión al registrar el pago");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="container">
        <div className="card" style={{ padding: 32 }}>
          <div className="page-header">
            <div>
              <p className="eyebrow">Factura</p>
              <h1>{invoice?.number ?? "..."}</h1>
            </div>
            <Link className="btn btn-secondary" href="/invoices">
              Volver
            </Link>
          </div>

          {error ? <p className="error">{error}</p> : null}

          {loading ? (
            <p style={{ color: "var(--muted)" }}>Cargando...</p>
          ) : !invoice ? (
            <p style={{ color: "var(--muted)" }}>Factura no encontrada.</p>
          ) : (
            <>
              <div className="grid-3" style={{ marginBottom: 20 }}>
                <article className="metric">
                  <span>Cliente</span>
                  <strong>{invoice.customer.name}</strong>
                  <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                    {invoice.customer.documentType} {invoice.customer.documentNumber}
                  </p>
                </article>
                <article className="metric">
                  <span>Estado</span>
                  <strong>{statusLabels[invoice.status]}</strong>
                  <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                    {formatDate(invoice.issueDate)}
                  </p>
                </article>
                <article className="metric metric-warning">
                  <span>Saldo</span>
                  <strong>{formatCurrency(invoice.totalCents - invoice.paidCents)}</strong>
                  <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                    de {formatCurrency(invoice.totalCents)}
                  </p>
                </article>
              </div>

              <section className="card">
                <h2>Detalle</h2>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Cant.</th>
                        <th>Precio</th>
                        <th>Desc.</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.unitPriceCents)}</td>
                          <td>{formatCurrency(item.discountCents)}</td>
                          <td>{formatCurrency(item.lineTotalCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 16, maxWidth: 280, marginLeft: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Subtotal</span>
                    <strong>{formatCurrency(invoice.subtotalCents)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ color: "var(--muted)" }}>IVA</span>
                    <strong>{formatCurrency(invoice.taxCents)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: "1.2rem" }}>
                    <span>Total</span>
                    <strong>{formatCurrency(invoice.totalCents)}</strong>
                  </div>
                </div>
              </section>

              <div className="page-columns" style={{ marginTop: 20 }}>
                <section className="card">
                  <h2>Pagos</h2>
                  {invoice.payments.length === 0 ? (
                    <p style={{ color: "var(--muted)" }}>Sin pagos registrados.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Método</th>
                            <th>Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>{formatDate(payment.paidAt)}</td>
                              <td>{methodLabels[payment.method]}</td>
                              <td>{formatCurrency(payment.amountCents)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {invoice.status !== "PAID" && invoice.status !== "VOID" && invoice.status !== "DRAFT" ? (
                  <form className="card" onSubmit={onPay}>
                    <h2>Registrar pago</h2>
                    <div className="field">
                      <label htmlFor="amount">Monto</label>
                      <input
                        id="amount"
                        name="amount"
                        type="number"
                        min="1"
                        step="1"
                        required
                        defaultValue={(invoice.totalCents - invoice.paidCents) / 100}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="method">Método</label>
                      <select id="method" name="method" defaultValue="CASH">
                        {Object.entries(methodLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="reference">Referencia</label>
                      <input id="reference" name="reference" placeholder="Opcional" />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: "100%" }}>
                      {saving ? "Guardando..." : "Registrar pago"}
                    </button>
                  </form>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
