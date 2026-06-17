import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: { business: true },
    });

    if (!user || !user.isActive || !user.business.isActive) {
      return jsonError("Correo o contraseña incorrectos", 401);
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      return jsonError("Correo o contraseña incorrectos", 401);
    }

    await createSession({
      userId: user.id,
      businessId: user.businessId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        business: {
          id: user.business.id,
          tradeName: user.business.tradeName,
          nit: `${user.business.nit}-${user.business.verificationDigit}`,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
