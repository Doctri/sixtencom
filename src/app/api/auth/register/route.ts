import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos
    const data = registerSchema.parse(body);
    const email = data.email.toLowerCase();

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese correo" }, { status: 409 });
    }

    // Verificar si el negocio ya existe
    const existingBusiness = await prisma.business.findUnique({
      where: { nit: data.nit },
    });
    if (existingBusiness) {
      return NextResponse.json({ error: "Ya existe una empresa registrada con ese NIT" }, { status: 409 });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Crear negocio y usuario en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          tradeName: data.tradeName,
          legalName: data.legalName,
          nit: data.nit,
          verificationDigit: data.verificationDigit,
          address: data.address,
          city: data.city,
          department: data.department,
          phone: data.phone ? data.phone : null,
          email: email,
          taxRegime: data.taxRegime,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName: data.fullName,
          role: "OWNER",
          businessId: business.id,
        },
      });

      return { business, user };
    });

    // Crear respuesta exitosa
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role,
          business: {
            id: result.business.id,
            tradeName: result.business.tradeName,
            nit: `${result.business.nit}-${result.business.verificationDigit}`,
          },
        },
      },
      { status: 201 }
    );

    // Crear sesión usando headers en lugar de cookies directo
    try {
      await createSession({
        userId: result.user.id,
        businessId: result.business.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
      });
    } catch (sessionError) {
      console.error("Session creation error:", sessionError);
      // Continuar aunque falle la sesión
    }

    return response;
  } catch (error) {
    console.error("Register error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return NextResponse.json(
          { error: "El email o NIT ya están registrados" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
