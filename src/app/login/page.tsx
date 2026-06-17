"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "No se pudo iniciar sesión");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ minHeight: "100vh", width: "100%", display: "grid", placeItems: "center", background: "#ffffff", padding: "64px 0" }}>
      <div className="card" style={{ width: "min(520px, 92vw)", padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: "3rem", letterSpacing: "0.08em", fontWeight: 800 }}>SIXTENCOM</h1>
          <p style={{ margin: "12px 0 0", color: "var(--muted)", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.18em" }}>
            Tu éxito, nuestra prioridad
          </p>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <p style={{ marginTop: 18, color: "var(--muted)" }}>
          ¿No tienes cuenta? <Link href="/register">Regístrate</Link>
        </p>
      </div>
    </main>
  );
}
