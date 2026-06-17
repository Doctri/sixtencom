import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);
    const email = data.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return jsonError("Ya existe una cuenta con ese correo", 409);
    }

    const existingBusiness = await prisma.business.findUnique({
      where: { nit: data.nit },
    });
    if (existingBusiness) {
      return jsonError("Ya existe una empresa registrada con ese NIT", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

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
          phone: data.phone,
          email,
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

    await createSession({
      userId: result.user.id,
      businessId: result.business.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
    });

    return Response.json(
      {
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
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
