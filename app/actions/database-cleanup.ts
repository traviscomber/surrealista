"use server"

export async function cleanupDatabase(_tables: string[]) {
  return {
    success: false,
    message:
      "La limpieza masiva de tablas fue deshabilitada por seguridad. Use una migración u operación auditada con alcance explícito, respaldo y rollback.",
    deletedCounts: {},
  }
}
