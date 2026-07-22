"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? "").trim(),
      tradeName: String(form.get("tradeName") ?? "").trim(),
      legalName: String(form.get("legalName") ?? "").trim(),
      nit: String(form.get("nit") ?? "").trim(),
      verificationDigit: String(form.get("verificationDigit") ?? "").trim(),
      address: String(form.get("address") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      department: String(form.get("department") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim() || null,
      taxRegime: String(form.get("taxRegime") ?? "SIMPLIFICADO").trim(),
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "No se pudo crear la cuenta");
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
    <main className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-header">
          <h1 className="auth-title">SIXTENCOM</h1>
          <p className="auth-subtitle">Tu éxito, nuestra prioridad</p>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="fullName">Nombre completo</label>
            <input id="fullName" name="fullName" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" required autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="tradeName">Nombre comercial</label>
            <input id="tradeName" name="tradeName" required />
          </div>
          <div className="field">
            <label htmlFor="legalName">Razón social</label>
            <input id="legalName" name="legalName" required />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="nit">NIT</label>
              <input id="nit" name="nit" required />
            </div>
            <div className="field">
              <label htmlFor="verificationDigit">Dígito</label>
              <input id="verificationDigit" name="verificationDigit" required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="address">Dirección</label>
            <input id="address" name="address" required />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="city">Ciudad</label>
              <input id="city" name="city" required />
            </div>
            <div className="field">
              <label htmlFor="department">Departamento</label>
              <input id="department" name="department" required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="phone">Teléfono</label>
            <input id="phone" name="phone" type="tel" placeholder="Ej. 3001234567" />
          </div>
          <div className="field">
            <label htmlFor="taxRegime">Régimen</label>
            <select id="taxRegime" name="taxRegime" defaultValue="SIMPLIFICADO">
              <option value="SIMPLIFICADO">SIMPLIFICADO</option>
              <option value="COMUN">COMUN</option>
              <option value="NO_RESPONSABLE">NO_RESPONSABLE</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <p className="auth-footnote">
          ¿Ya tienes cuenta? <Link href="/login">Ingresar</Link>
        </p>
      </div>
    </main>
  );
}
