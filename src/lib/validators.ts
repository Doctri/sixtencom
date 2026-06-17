import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  tradeName: z.string().min(2, "Nombre comercial requerido"),
  legalName: z.string().min(2, "Razón social requerida"),
  nit: z.string().regex(/^\d{6,15}$/, "NIT inválido (solo números)"),
  verificationDigit: z.string().regex(/^\d$/, "Dígito de verificación inválido"),
  address: z.string().min(5, "Dirección requerida"),
  city: z.string().min(2, "Ciudad requerida"),
  department: z.string().min(2, "Departamento requerido"),
  phone: z.string().optional(),
  taxRegime: z.enum(["SIMPLIFICADO", "COMUN", "NO_RESPONSABLE"]),
});

const moneySchema = z.coerce
  .number()
  .min(0, "El valor no puede ser negativo")
  .max(999999999, "El valor es demasiado alto");

export const productSchema = z.object({
  name: z.string().min(2, "Nombre requerido").max(120, "Nombre demasiado largo"),
  description: z.string().max(500, "Descripcion demasiado larga").optional().or(z.literal("")),
  sku: z.string().max(60, "SKU demasiado largo").optional().or(z.literal("")),
  barcode: z.string().max(80, "Codigo de barras demasiado largo").optional().or(z.literal("")),
  category: z.string().max(80, "Categoria demasiado larga").optional().or(z.literal("")),
  unit: z.string().min(1, "Unidad requerida").max(12, "Unidad demasiado larga").default("UND"),
  vatRate: z.enum(["EXEMPT", "VAT_0", "VAT_5", "VAT_19"]),
  price: moneySchema.refine((value) => value > 0, "El precio debe ser mayor que cero"),
  cost: moneySchema.default(0),
  stock: z.coerce.number().int("Stock invalido").min(0, "Stock no puede ser negativo").default(0),
  minStock: z.coerce.number().int("Stock minimo invalido").min(0, "Stock minimo no puede ser negativo").default(0),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Nombre requerido").max(120, "Nombre demasiado largo"),
  documentType: z.enum(["CC", "NIT", "CE", "TI", "PAS"]),
  documentNumber: z.string().min(4, "Documento inválido").max(30, "Documento demasiado largo"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().max(30, "Teléfono inválido").optional().or(z.literal("")),
  address: z.string().max(200, "Dirección demasiado larga").optional().or(z.literal("")),
  city: z.string().max(80, "Ciudad demasiado larga").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const invoiceItemSchema = z.object({
  productId: z.string().min(1).optional().or(z.literal("")),
  description: z.string().min(1, "Descripción requerida").max(200, "Descripción demasiado larga"),
  quantity: z.coerce.number().int("Cantidad inválida").min(1, "La cantidad debe ser al menos 1"),
  unitPrice: moneySchema.refine((value) => value > 0, "El precio debe ser mayor que cero"),
  discount: moneySchema.default(0),
  vatRate: z.enum(["EXEMPT", "VAT_0", "VAT_5", "VAT_19"]).default("VAT_19"),
});

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Cliente requerido"),
  prefix: z.string().min(1).max(6, "Prefijo demasiado largo").default("FV"),
  status: z.enum(["DRAFT", "OPEN"]).default("OPEN"),
  dueDate: z.string().datetime().optional().or(z.literal("")),
  notes: z.string().max(500, "Notas demasiado largas").optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "Agrega al menos un producto"),
});

export const paymentSchema = z.object({
  amount: moneySchema.refine((value) => value > 0, "El monto debe ser mayor que cero"),
  method: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]).default("CASH"),
  reference: z.string().max(80, "Referencia demasiado larga").optional().or(z.literal("")),
  paidAt: z.string().datetime().optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;

export function formatNit(nit: string, verificationDigit: string) {
  return `${nit}-${verificationDigit}`;
}
