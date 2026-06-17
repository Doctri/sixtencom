# Sixtencom

Sistema de ventas para Colombia con facturación DIAN.

## Stack

- Next.js 15 + TypeScript
- PostgreSQL + Prisma
- Autenticación con JWT en cookie httpOnly

## Fase 1 (actual)

- Estructura del proyecto
- Base de datos (`Business`, `User`)
- Registro de empresa + login
- Dashboard protegido

## Fase 2 (actual)

- Productos por empresa
- Precio, costo, IVA, SKU y codigo de barras
- Stock actual y stock minimo
- Estado activo/inactivo
- API protegida y pantalla `/products`

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Instalación

```bash
cd C:\Users\aguir\Projects\sixtencom
copy .env.example .env
npm install
npm run db:generate
npm run db:push
npm run dev
```

Abre http://localhost:3000

## Variables de entorno

Copia `.env.example` a `.env` y ajusta:

- `DATABASE_URL`: conexión PostgreSQL
- `JWT_SECRET`: clave larga y segura
- `NEXT_PUBLIC_APP_URL`: URL pública de la app

## Próximas fases

1. Productos e inventario
2. Clientes
3. Caja POS
4. Facturación DIAN (DEE POS / factura electrónica)
5. Reportes y cortes de caja
