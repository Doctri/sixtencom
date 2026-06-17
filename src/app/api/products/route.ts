import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { jsonError, handleApiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";

function toCents(value: number) {
  return Math.round(value * 100);
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function serializeProduct(product: {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  unit: string;
  vatRate: string;
  priceCents: number;
  costCents: number;
  stock: number;
  minStock: number;
  status: string;
  createdAt: Date;
}) {
  return {
    ...product,
    price: product.priceCents / 100,
    cost: product.costCents / 100,
    lowStock: product.stock <= product.minStock,
  };
}

export async function GET() {
  try {
    const session = await requireSession();

    const products = await prisma.product.findMany({
      where: { businessId: session.businessId },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });

    return Response.json({ products: products.map(serializeProduct) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        businessId: session.businessId,
        name: data.name.trim(),
        description: emptyToNull(data.description),
        sku: emptyToNull(data.sku),
        barcode: emptyToNull(data.barcode),
        category: emptyToNull(data.category),
        unit: data.unit.trim().toUpperCase(),
        vatRate: data.vatRate,
        priceCents: toCents(data.price),
        costCents: toCents(data.cost),
        stock: data.stock,
        minStock: data.minStock,
        status: data.status,
      },
    });

    return Response.json({ product: serializeProduct(product) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("Ya existe un producto con ese SKU o codigo de barras", 409);
    }

    return handleApiError(error);
  }
}
