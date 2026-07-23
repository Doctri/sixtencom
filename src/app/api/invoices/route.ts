import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { jsonError, handleApiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeLine, computeTotals, toCents } from "@/lib/invoice";
import { invoiceSchema } from "@/lib/validators";

function emptyToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function GET() {
  try {
    const session = await requireSession();

    const invoices = await prisma.invoice.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });

    return Response.json({ invoices });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = invoiceSchema.parse(body);

    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, businessId: session.businessId },
      select: { id: true },
    });
    if (!customer) {
      return jsonError("Cliente no encontrado", 404);
    }

    // Resolver productos referenciados (deben pertenecer a la empresa)
    const productIds = [...new Set(data.items.map((item) => item.productId).filter((id): id is string => !!id))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, businessId: session.businessId },
      select: { id: true, name: true, stock: true },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const id of productIds) {
      if (!productMap.has(id)) {
        return jsonError("Uno de los productos no existe en tu empresa", 404);
      }
    }

    // Calcular líneas y totales (en centavos, en el backend)
    const lines = data.items.map((item) => {
      const computed = computeLine({
        quantity: item.quantity,
        unitPriceCents: toCents(item.unitPrice),
        discountCents: toCents(item.discount),
        vatRate: item.vatRate,
      });
      return { item, computed };
    });

    const totals = computeTotals(lines.map((line) => line.computed));
    const affectsStock = data.status === "OPEN";

    // Validar stock disponible si la factura se emite (OPEN)
    if (affectsStock) {
      const requestedByProduct = new Map<string, number>();
      for (const { item } of lines) {
        if (item.productId) {
          requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) ?? 0) + item.quantity);
        }
      }
      for (const [id, qty] of requestedByProduct) {
        const product = productMap.get(id)!;
        if (product.stock < qty) {
          return jsonError(`Stock insuficiente para "${product.name}" (disponible: ${product.stock})`, 409);
        }
      }
    }

    const dueDate = data.dueDate ? new Date(data.dueDate) : null;

    const invoice = await prisma.$transaction(async (tx) => {
      // Consecutivo atómico por empresa + prefijo
      const counter = await tx.invoiceCounter.upsert({
        where: { businessId_prefix: { businessId: session.businessId, prefix: data.prefix } },
        create: { businessId: session.businessId, prefix: data.prefix, next: 2 },
        update: { next: { increment: 1 } },
      });
      const seq = counter.next - 1;
      const number = `${data.prefix}-${String(seq).padStart(4, "0")}`;

      const created = await tx.invoice.create({
        data: {
          businessId: session.businessId,
          number,
          customerId: customer.id,
          userId: session.userId,
          status: data.status,
          dueDate,
          notes: emptyToNull(data.notes),
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
          paidCents: 0,
          items: {
            create: lines.map(({ item, computed }) => ({
              productId: item.productId || null,
              description: item.description.trim(),
              quantity: computed.quantity,
              unitPriceCents: computed.unitPriceCents,
              discountCents: computed.discountCents,
              vatRate: computed.vatRate,
              lineTotalCents: computed.lineTotalCents,
            })),
          },
        },
        include: { items: true, customer: { select: { id: true, name: true } } },
      });

      // Descontar inventario + kardex (solo si la factura se emite)
      if (affectsStock) {
        for (const { item } of lines) {
          if (!item.productId) continue;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "SALE",
              quantity: -item.quantity,
              reason: "Venta",
              reference: created.id,
            },
          });
        }
      }

      return created;
    });

    return Response.json({ invoice }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("Número de factura duplicado, intenta de nuevo", 409);
    }

    return handleApiError(error);
  }
}
