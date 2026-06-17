import { NextRequest } from "next/server";
import { jsonError, handleApiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCents } from "@/lib/invoice";
import { paymentSchema } from "@/lib/validators";

function emptyToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await requireSession();
    const body = await request.json();
    const data = paymentSchema.parse(body);

    const invoice = await prisma.invoice.findFirst({
      where: { id, businessId: session.businessId },
      select: { id: true, status: true, totalCents: true, paidCents: true },
    });

    if (!invoice) {
      return jsonError("Factura no encontrada", 404);
    }
    if (invoice.status === "VOID") {
      return jsonError("La factura está anulada", 409);
    }
    if (invoice.status === "DRAFT") {
      return jsonError("Emite la factura antes de registrar pagos", 409);
    }
    if (invoice.status === "PAID") {
      return jsonError("La factura ya está pagada", 409);
    }

    const amountCents = toCents(data.amount);
    const newPaid = invoice.paidCents + amountCents;
    const status = newPaid >= invoice.totalCents ? "PAID" : "PARTIAL";

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amountCents,
          method: data.method,
          reference: emptyToNull(data.reference),
          paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
        },
      });

      return tx.invoice.update({
        where: { id: invoice.id },
        data: { paidCents: newPaid, status },
        include: { payments: { orderBy: { paidAt: "desc" } } },
      });
    });

    return Response.json({ invoice: updated }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
