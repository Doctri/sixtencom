import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { jsonError, handleApiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";

function emptyToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function GET() {
  try {
    const session = await requireSession();

    const customers = await prisma.customer.findMany({
      where: { businessId: session.businessId },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });

    return Response.json({ customers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = customerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        businessId: session.businessId,
        name: data.name.trim(),
        documentType: data.documentType,
        documentNumber: data.documentNumber.trim(),
        email: emptyToNull(data.email),
        phone: emptyToNull(data.phone),
        address: emptyToNull(data.address),
        city: emptyToNull(data.city),
        status: data.status,
      },
    });

    return Response.json({ customer }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("Ya existe un cliente con ese documento", 409);
    }

    return handleApiError(error);
  }
}
