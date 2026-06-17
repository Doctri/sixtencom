import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("No autorizado", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { business: true },
    });

    if (!user) {
      return jsonError("Usuario no encontrado", 404);
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        business: {
          id: user.business.id,
          tradeName: user.business.tradeName,
          legalName: user.business.legalName,
          nit: `${user.business.nit}-${user.business.verificationDigit}`,
          city: user.business.city,
          department: user.business.department,
          country: user.business.country,
          taxRegime: user.business.taxRegime,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
