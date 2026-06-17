import type { VatRate } from "@prisma/client";

const VAT_PERCENT: Record<VatRate, number> = {
  EXEMPT: 0,
  VAT_0: 0,
  VAT_5: 5,
  VAT_19: 19,
};

export function vatPercent(rate: VatRate) {
  return VAT_PERCENT[rate] ?? 0;
}

export function toCents(value: number) {
  return Math.round(value * 100);
}

export type ComputedLine = {
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  vatRate: VatRate;
  /** base gravable de la línea (neto sin IVA) */
  netCents: number;
  taxCents: number;
  lineTotalCents: number;
};

export function computeLine(input: {
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  vatRate: VatRate;
}): ComputedLine {
  const gross = input.quantity * input.unitPriceCents;
  const netCents = Math.max(gross - input.discountCents, 0);
  const taxCents = Math.round((netCents * vatPercent(input.vatRate)) / 100);
  return {
    quantity: input.quantity,
    unitPriceCents: input.unitPriceCents,
    discountCents: input.discountCents,
    vatRate: input.vatRate,
    netCents,
    taxCents,
    lineTotalCents: netCents + taxCents,
  };
}

export type InvoiceTotals = {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
};

export function computeTotals(lines: ComputedLine[]): InvoiceTotals {
  return lines.reduce<InvoiceTotals>(
    (acc, line) => ({
      subtotalCents: acc.subtotalCents + line.netCents,
      discountCents: acc.discountCents + line.discountCents,
      taxCents: acc.taxCents + line.taxCents,
      totalCents: acc.totalCents + line.lineTotalCents,
    }),
    { subtotalCents: 0, discountCents: 0, taxCents: 0, totalCents: 0 },
  );
}
