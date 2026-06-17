"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
  category?: string | null;
  status: "ACTIVE" | "INACTIVE";
  lowStock?: boolean;
};

const vatLabels = {
  EXEMPT: "Exento",
VAT_0: "0%",
  VAT_5: "5%",
  VAT_19: "19%",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activeCount = useMemo(() => products.filter((product) => product.status === "ACTIVE").length, [products]);
  const lowStockCount = useMemo(
    () => products.filter((product) => product.lowStock && product.status === "ACTIVE").length,
    [products],
  );

  async function parseJsonResponse(response: Response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  async function loadProducts() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/products", { credentials: "same-origin" });
      const data = await parseJsonResponse(response);
      if (!response.ok) {
        setError(data?.error ?? "No se pudieron cargar los productos");
        return;
      }
      if (!data?.products) {
        setError("Respuesta inválida del servidor");
        return;
      }
      setProducts(data.products);
    } catch {
      setError("Error de conexion al cargar productos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
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
      description: getFormValue(form, "description"),
      sku: getFormValue(form, "sku"),
      barcode: getFormValue(form, "barcode"),
      category: getFormValue(form, "category"),
      unit: getFormValue(form, "unit") ?? "1",
      vatRate: getFormValue(form, "vatRate") ?? "VAT_19",
      price: getFormValue(form, "price"),
      cost: getFormValue(form, "cost") ?? "0",
      stock: getFormValue(form, "stock") ?? "0",
      minStock: getFormValue(form, "minStock") ?? "0",
      status: getFormValue(form, "status") ?? "ACTIVE",
    };

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse(response);
      if (!response.ok) {
        setError(data?.error ?? "No se pudo crear el producto");
        return;
      }
      if (!data?.product) {
        setError("Respuesta inválida del servidor");
        return;
      }
      setProducts((current) => [data.product, ...current]);
      setError("");
      formElement.reset();
    } catch {
      setError("Error de conexion al guardar producto");
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
              <p className="eyebrow">Productos</p>
              <h1>Catálogo</h1>
            </div>
            <Link className="btn btn-secondary" href="/dashboard">
              Volver al panel
            </Link>
          </div>

          <div className="page-nav">
            <Link href="/dashboard">Inicio</Link>
            <Link className="active" href="/products">
              Catálogo
            </Link>
            <Link href="/customers">Clientes</Link>
          </div>

          <div className="grid-3" style={{ marginBottom: 20 }}>
            <article className="metric">
              <span>Total</span>
              <strong>{products.length}</strong>
            </article>
            <article className="metric">
              <span>Activos</span>
              <strong>{activeCount}</strong>
            </article>
            <article className="metric metric-warning">
              <span>Stock bajo</span>
              <strong>{lowStockCount}</strong>
            </article>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="page-columns">
            <form className="card" onSubmit={onSubmit}>
              <h2>Nuevo producto</h2>
              <div className="grid-2">
              <div className="field">
                <label htmlFor="name">Nombre</label>
                <input id="name" name="name" required placeholder="Ej. Arroz Diana 500 g" />
              </div>
              <div className="field">
                <label htmlFor="category">Categoría</label>
                <select id="category" name="category" defaultValue="Alimentos">
                  <option value="Alimentos">Alimentos</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Hogar">Hogar</option>
                  <option value="Farmacia">Farmacia</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="description">Descripción</label>
              <input id="description" name="description" placeholder="Descripción opcional" />
            </div>
            <div className="grid-3">
              <div className="field">
                <label htmlFor="sku">SKU</label>
                <input id="sku" name="sku" placeholder="SKU123" />
              </div>
              <div className="field">
                <label htmlFor="barcode">Código de barras</label>
                <input id="barcode" name="barcode" placeholder="7891234567890" />
              </div>
              <div className="field">
                <label htmlFor="unit">Unidad</label>
                <input id="unit" name="unit" type="number" min="1" step="1" defaultValue="1" />
              </div>
            </div>
            <div className="grid-3">
              <div className="field">
                <label htmlFor="vatRate">IVA</label>
                <select id="vatRate" name="vatRate" defaultValue="VAT_19">
                  {Object.entries(vatLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="status">Estado</label>
                <select id="status" name="status" defaultValue="ACTIVE">
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="minStock">Stock mínimo</label>
                <input id="minStock" name="minStock" type="number" min="0" step="1" defaultValue="0" />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="price">Precio</label>
                <input id="price" name="price" type="number" min="1" step="1" required placeholder="4500" />
              </div>
              <div className="field">
                <label htmlFor="cost">Costo</label>
                <input id="cost" name="cost" type="number" min="0" step="1" defaultValue="0" />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="stock">Stock</label>
                <input id="stock" name="stock" type="number" min="0" step="1" defaultValue="0" />
              </div>
              <div className="field"></div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: "100%" }}>
              {saving ? "Guardando..." : "Crear producto"}
            </button>
          </form>

          <section className="card">
            <h2>Inventario</h2>
            {loading ? (
              <p style={{ color: "var(--muted)" }}>Cargando productos...</p>
            ) : products.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>Aun no hay productos. Crea el primero para probar el POS despues.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.category ?? "—"}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>
                          {product.stock}
                          {product.lowStock ? " • Bajo" : ""}
                        </td>
                        <td>{product.status === "ACTIVE" ? "Activo" : "Inactivo"}</td>
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
