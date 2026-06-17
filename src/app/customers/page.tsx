"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Customer = {
  id: string;
  name: string;
  documentType: string;
  documentNumber: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  status: "ACTIVE" | "INACTIVE";
};

const documentLabels: Record<string, string> = {
  CC: "Cédula",
  NIT: "NIT",
  CE: "Cédula Extranjería",
  TI: "Tarjeta Identidad",
  PAS: "Pasaporte",
};

function formatDocument(customer: Customer) {
  return `${documentLabels[customer.documentType] ?? customer.documentType} ${customer.documentNumber}`;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activeCount = useMemo(
    () => customers.filter((customer) => customer.status === "ACTIVE").length,
    [customers],
  );

  async function parseJsonResponse(response: Response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  async function loadCustomers() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/customers", { credentials: "same-origin" });
      const data = await parseJsonResponse(response);
      if (!response.ok) {
        setError(data?.error ?? "No se pudieron cargar los clientes");
        return;
      }
      if (!data?.customers) {
        setError("Respuesta inválida del servidor");
        return;
      }
      setCustomers(data.customers);
    } catch {
      setError("Error de conexión al cargar clientes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function getFormValue(form: FormData, name: string) {
    const value = form.get(name);
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: getFormValue(form, "name"),
      documentType: getFormValue(form, "documentType") ?? "CC",
      documentNumber: getFormValue(form, "documentNumber"),
      email: getFormValue(form, "email"),
      phone: getFormValue(form, "phone"),
      address: getFormValue(form, "address"),
      city: getFormValue(form, "city"),
      status: getFormValue(form, "status") ?? "ACTIVE",
    };

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse(response);
      if (!response.ok) {
        setError(data?.error ?? "No se pudo crear el cliente");
        return;
      }
      if (!data?.customer) {
        setError("Respuesta inválida del servidor");
        return;
      }
      setCustomers((current) => [data.customer, ...current]);
      setError("");
      formElement.reset();
    } catch {
      setError("Error de conexión al guardar el cliente");
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
              <p className="eyebrow">Clientes</p>
              <h1>Clientes</h1>
            </div>
            <Link className="btn btn-secondary" href="/dashboard">
              Volver al panel
            </Link>
          </div>

          <div className="page-nav">
            <Link href="/dashboard">Inicio</Link>
            <Link href="/products">Catálogo</Link>
            <Link className="active" href="/customers">
              Clientes
            </Link>
          </div>

          <div className="grid-3" style={{ marginBottom: 20 }}>
            <article className="metric">
              <span>Total</span>
              <strong>{customers.length}</strong>
            </article>
            <article className="metric">
              <span>Activos</span>
              <strong>{activeCount}</strong>
            </article>
            <article className="metric metric-warning">
              <span>Clientes nuevos</span>
              <strong>{customers.length > 0 ? customers[0].name : "—"}</strong>
            </article>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="page-columns">
            <form className="card" onSubmit={onSubmit}>
              <h2>Nuevo cliente</h2>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="name">Nombre</label>
                  <input id="name" name="name" required placeholder="Ej. Maria Perez" />
                </div>
                <div className="field">
                  <label htmlFor="documentType">Documento</label>
                  <select id="documentType" name="documentType" defaultValue="CC">
                    {Object.entries(documentLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label htmlFor="documentNumber">Número</label>
                  <input id="documentNumber" name="documentNumber" required placeholder="12345678" />
                </div>
                <div className="field">
                  <label htmlFor="status">Estado</label>
                  <select id="status" name="status" defaultValue="ACTIVE">
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="email">Correo</label>
                <input id="email" name="email" type="email" placeholder="cliente@correo.com" />
              </div>

              <div className="field">
                <label htmlFor="phone">Teléfono</label>
                <input id="phone" name="phone" type="tel" placeholder="3001234567" />
              </div>

              <div className="field">
                <label htmlFor="address">Dirección</label>
                <input id="address" name="address" placeholder="Calle 123 #45-67" />
              </div>

              <div className="field">
                <label htmlFor="city">Ciudad</label>
                <input id="city" name="city" placeholder="Medellín" />
              </div>

              <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: "100%" }}>
                {saving ? "Guardando..." : "Crear cliente"}
              </button>
            </form>

            <section className="card">
              <h2>Lista de clientes</h2>
              {loading ? (
                <p style={{ color: "var(--muted)" }}>Cargando clientes...</p>
              ) : customers.length === 0 ? (
                <p style={{ color: "var(--muted) " }}>Aún no hay clientes. Crea el primero para comenzar a vender.</p>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Documento</th>
                        <th>Contacto</th>
                        <th>Ciudad</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id}>
                          <td>{customer.name}</td>
                          <td>{formatDocument(customer)}</td>
                          <td>
                            {customer.email ?? "—"}
                            {customer.phone ? ` · ${customer.phone}` : ""}
                          </td>
                          <td>{customer.city ?? "—"}</td>
                          <td>{customer.status === "ACTIVE" ? "Activo" : "Inactivo"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
