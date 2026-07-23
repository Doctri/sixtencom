"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Customer = { id: string; name: string; status: "ACTIVE" | "INACTIVE" };
type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  vatRate: "EXEMPT" | "VAT_0" | "VAT_5" | "VAT_19";
};

type VatRate = Product["vatRate"];

type LineItem = {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: VatRate;
};

const vatLabels: Record<VatRate, string> = {
  EXEMPT: "Exento",
  VAT_0: "0%",
  VAT_5: "5%",
  VAT_19: "19%",
};

const vatPercent: Record<VatRate, number> = {
  EXEMPT: 0,
  VAT_0: 0,
  VAT_5: 5,
  VAT_19: 19,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

function emptyLine(): LineItem {
  return { productId: "", description: "", quantity: 1, unitPrice: 0, discount: 0, vatRate: "VAT_19" };
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState<"OPEN" | "DRAFT">("OPEN");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [customersRes, productsRes] = await Promise.all([
          fetch("/api/customers", { credentials: "same-origin" }),
          fetch("/api/products", { credentials: "same-origin" }),
        ]);
        const customersData = await customersRes.json().catch(() => null);
        const productsData = await productsRes.json().catch(() => null);
        setCustomers((customersData?.customers ?? []).filter((c: Customer) => c.status === "ACTIVE"));
        setProducts((productsData?.products ?? []).filter((p: Product & { status: string }) => p.status === "ACTIVE"));
      } catch {
        setError("No se pudieron cargar clientes o productos");
      }
    }
    load();
  }, []);

  function updateLine(index: number, patch: Partial<LineItem>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function onSelectProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      updateLine(index, { productId: "" });
      return;
    }
    updateLine(index, {
      productId,
      description: product.name,
      unitPrice: product.price,
      vatRate: product.vatRate,
    });
  }

  function addLine() {
    setLines((current) => [...current, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  }

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        const gross = line.quantity * line.unitPrice;
        const net = Math.max(gross - line.discount, 0);
        const tax = (net * vatPercent[line.vatRate]) / 100;
        return {
          subtotal: acc.subtotal + net,
          discount: acc.discount + line.discount,
          tax: acc.tax + tax,
          total: acc.total + net + tax,
        };
      },
      { subtotal: 0, discount: 0, tax: 0, total: 0 },
    );
  }, [lines]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!customerId) {
      setError("Selecciona un cliente");
      return;
    }
    const validLines = lines.filter((line) => line.description.trim() && line.quantity > 0 && line.unitPrice > 0);
    if (validLines.length === 0) {
      setError("Agrega al menos un producto con cantidad y precio");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          customerId,
          status,
          notes: notes.trim() || undefined,
          items: validLines.map((line) => ({
            productId: line.productId || undefined,
            description: line.description.trim(),
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            vatRate: line.vatRate,
          })),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "No se pudo crear la factura");
        return;
      }
      router.push(`/invoices/${data.invoice.id}`);
    } catch {
      setError("Error de conexión al crear la factura");
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
              <p className="eyebrow">Ventas</p>
              <h1>Nueva factura</h1>
            </div>
            <Link className="btn btn-secondary" href="/invoices">
              Volver
            </Link>
          </div>

          {error ? <p className="error">{error}</p> : null}

          {customers.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              Necesitas al menos un cliente activo. <Link href="/customers">Crea un cliente</Link> primero.
            </p>
          ) : null}

          <form className="card" onSubmit={onSubmit}>
            <div className="grid-3">
              <div className="field">
                <label htmlFor="customer">Cliente</label>
                <select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                  <option value="">Selecciona...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="status">Estado</label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value as "OPEN" | "DRAFT")}>
                  <option value="OPEN">Emitir (descuenta stock)</option>
                  <option value="DRAFT">Guardar borrador</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="notes">Notas</label>
                <input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            <h2 style={{ marginTop: 16 }}>Productos</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Descripción</th>
                    <th>Cant.</th>
                    <th>Precio</th>
                    <th>Desc.</th>
                    <th>IVA</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => {
                    const gross = line.quantity * line.unitPrice;
                    const net = Math.max(gross - line.discount, 0);
                    const lineTotal = net + (net * vatPercent[line.vatRate]) / 100;
                    return (
                      <tr key={index}>
                        <td>
                          <select value={line.productId} onChange={(e) => onSelectProduct(index, e.target.value)}>
                            <option value="">Manual</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.stock})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            value={line.description}
                            onChange={(e) => updateLine(index, { description: e.target.value })}
                            placeholder="Descripción"
                          />
                        </td>
                        <td style={{ maxWidth: 80 }}>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                          />
                        </td>
                        <td style={{ maxWidth: 110 }}>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) })}
                          />
                        </td>
                        <td style={{ maxWidth: 100 }}>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={line.discount}
                            onChange={(e) => updateLine(index, { discount: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <select
                            value={line.vatRate}
                            onChange={(e) => updateLine(index, { vatRate: e.target.value as VatRate })}
                          >
                            {Object.entries(vatLabels).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{formatCurrency(lineTotal)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => removeLine(index)}
                            disabled={lines.length === 1}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button type="button" className="btn btn-secondary" onClick={addLine} style={{ marginTop: 12 }}>
              + Agregar línea
            </button>

            <div className="grid-2" style={{ marginTop: 24 }}>
              <div />
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Subtotal</span>
                  <strong>{formatCurrency(totals.subtotal)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ color: "var(--muted)" }}>Descuento</span>
                  <strong>{formatCurrency(totals.discount)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ color: "var(--muted)" }}>IVA</span>
                  <strong>{formatCurrency(totals.tax)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: "1.2rem" }}>
                  <span>Total</span>
                  <strong>{formatCurrency(totals.total)}</strong>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving || customers.length === 0}
              style={{ width: "100%", marginTop: 20 }}
            >
              {saving ? "Guardando..." : status === "OPEN" ? "Emitir factura" : "Guardar borrador"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
