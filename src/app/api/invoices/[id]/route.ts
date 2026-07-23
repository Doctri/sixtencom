import { NextRequest } from "next/server";
import { jsonError, handleApiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await requireSession();

    const invoice = await prisma.invoice.findFirst({
      where: { id, businessId: session.businessId },
      include: {
        customer: true,
        user: { select: { id: true, fullName: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        payments: { orderBy: { paidAt: "desc" } },
      },
    });

    if (!invoice) {
      return jsonError("Factura no encontrada", 404);
    }

    return Response.json({ invoice });
  } catch (error) {
    return handleApiError(error);
  }
}
