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

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await requireSession();
    const body = await request.json();
    const data = customerSchema.parse(body);

    const updated = await prisma.customer.updateMany({
      where: { id, businessId: session.businessId },
      data: {
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

    if (updated.count === 0) {
      return jsonError("Cliente no encontrado", 404);
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return jsonError("Cliente no encontrado", 404);
    }

    return Response.json({ customer });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("Ya existe un cliente con ese documento", 409);
    }

    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await requireSession();

    const deleted = await prisma.customer.deleteMany({
      where: { id, businessId: session.businessId },
    });

    if (deleted.count === 0) {
      return jsonError("Cliente no encontrado", 404);
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return jsonError("No se puede eliminar: el cliente tiene facturas asociadas", 409);
    }

    return handleApiError(error);
  }
}
