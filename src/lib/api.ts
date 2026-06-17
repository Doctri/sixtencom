import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.errors[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  console.error(error);
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
}
