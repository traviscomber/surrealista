/**
 * Servicio para la gestión de documentos generados por IA
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import type { AIDocument, AIDocumentRequest, AIDocumentType, AIResult } from "../types"
import { generateDocumentFromTemplate } from "./document-templates"
import { sanitizeDocumentContent } from "./document-utils"

// Cliente de Supabase para el servidor
const getServerSupabaseClient = () => {
  return createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
}

// Cliente de Supabase para el cliente
const getClientSupabaseClient = () => {
  return createClientComponentClient()
}

/**
 * Crea un nuevo documento generado por IA
 */
export async function createDocument(request: AIDocumentRequest, userId: string): Promise<AIResult<AIDocument>> {
  try {
    const supabase = getServerSupabaseClient()

    // Validar la solicitud
    if (!request.title || !request.type) {
      return {
        success: false,
        error: "El título y el tipo de documento son obligatorios",
        timestamp: new Date(),
      }
    }

    // Generar contenido si no se proporciona
    let content = request.content
    if (!content) {
      content = await generateDocumentFromTemplate(request.type, {
        title: request.title,
        metadata: request.metadata || {},
        relatedEntityId: request.relatedEntityId,
      })
    }

    // Sanitizar el contenido
    const sanitizedContent = sanitizeDocumentContent(content)

    // Crear el documento en la base de datos
    const { data, error } = await supabase
      .from("ai_documents")
      .insert({
        type: request.type,
        title: request.title,
        content: sanitizedContent,
        metadata: request.metadata || {},
        created_by: userId,
        related_entity_id: request.relatedEntityId,
        tags: request.tags || [],
        status: "draft",
        version: 1,
      })
      .select()
      .single()

    if (error) {
      console.error("Error al crear documento:", error)
      return {
        success: false,
        error: `Error al crear documento: ${error.message}`,
        timestamp: new Date(),
      }
    }

    // Convertir el resultado a la interfaz AIDocument
    const document: AIDocument = {
      id: data.id,
      type: data.type as AIDocumentType,
      title: data.title,
      content: data.content,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      relatedEntityId: data.related_entity_id,
      tags: data.tags,
      status: data.status,
      version: data.version,
    }

    return {
      success: true,
      data: document,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error("Error inesperado al crear documento:", error)
    return {
      success: false,
      error: `Error inesperado al crear documento: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date(),
    }
  }
}

/**
 * Obtiene un documento por su ID
 */
export async function getDocumentById(id: string): Promise<AIResult<AIDocument>> {
  try {
    const supabase = getServerSupabaseClient()

    const { data, error } = await supabase.from("ai_documents").select("*").eq("id", id).single()

    if (error) {
      return {
        success: false,
        error: `Error al obtener documento: ${error.message}`,
        timestamp: new Date(),
      }
    }

    if (!data) {
      return {
        success: false,
        error: "Documento no encontrado",
        timestamp: new Date(),
      }
    }

    // Convertir el resultado a la interfaz AIDocument
    const document: AIDocument = {
      id: data.id,
      type: data.type as AIDocumentType,
      title: data.title,
      content: data.content,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      relatedEntityId: data.related_entity_id,
      tags: data.tags,
      status: data.status,
      version: data.version,
    }

    return {
      success: true,
      data: document,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error("Error inesperado al obtener documento:", error)
    return {
      success: false,
      error: `Error inesperado al obtener documento: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date(),
    }
  }
}

/**
 * Actualiza un documento existente
 */
export async function updateDocument(id: string, updates: Partial<AIDocumentRequest>): Promise<AIResult<AIDocument>> {
  try {
    const supabase = getServerSupabaseClient()

    // Obtener el documento actual para validar
    const { data: existingDoc, error: fetchError } = await supabase
      .from("ai_documents")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !existingDoc) {
      return {
        success: false,
        error: `Error al obtener documento para actualizar: ${fetchError?.message || "Documento no encontrado"}`,
        timestamp: new Date(),
      }
    }

    // Preparar los datos para actualizar
    const updateData: any = {}

    if (updates.title) updateData.title = updates.title
    if (updates.content) updateData.content = sanitizeDocumentContent(updates.content)
    if (updates.metadata) updateData.metadata = updates.metadata
    if (updates.tags) updateData.tags = updates.tags
    if (updates.type) updateData.type = updates.type

    // Incrementar la versión
    updateData.version = existingDoc.version + 1

    // Actualizar el documento
    const { data, error } = await supabase.from("ai_documents").update(updateData).eq("id", id).select().single()

    if (error) {
      return {
        success: false,
        error: `Error al actualizar documento: ${error.message}`,
        timestamp: new Date(),
      }
    }

    // Convertir el resultado a la interfaz AIDocument
    const document: AIDocument = {
      id: data.id,
      type: data.type as AIDocumentType,
      title: data.title,
      content: data.content,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      relatedEntityId: data.related_entity_id,
      tags: data.tags,
      status: data.status,
      version: data.version,
    }

    return {
      success: true,
      data: document,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error("Error inesperado al actualizar documento:", error)
    return {
      success: false,
      error: `Error inesperado al actualizar documento: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date(),
    }
  }
}

/**
 * Cambia el estado de un documento
 */
export async function changeDocumentStatus(
  id: string,
  status: "draft" | "published" | "archived",
): Promise<AIResult<AIDocument>> {
  try {
    const supabase = getServerSupabaseClient()

    const { data, error } = await supabase.from("ai_documents").update({ status }).eq("id", id).select().single()

    if (error) {
      return {
        success: false,
        error: `Error al cambiar estado del documento: ${error.message}`,
        timestamp: new Date(),
      }
    }

    // Convertir el resultado a la interfaz AIDocument
    const document: AIDocument = {
      id: data.id,
      type: data.type as AIDocumentType,
      title: data.title,
      content: data.content,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      relatedEntityId: data.related_entity_id,
      tags: data.tags,
      status: data.status,
      version: data.version,
    }

    return {
      success: true,
      data: document,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error("Error inesperado al cambiar estado del documento:", error)
    return {
      success: false,
      error: `Error inesperado al cambiar estado del documento: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date(),
    }
  }
}

/**
 * Elimina un documento
 */
export async function deleteDocument(id: string): Promise<AIResult<void>> {
  try {
    const supabase = getServerSupabaseClient()

    const { error } = await supabase.from("ai_documents").delete().eq("id", id)

    if (error) {
      return {
        success: false,
        error: `Error al eliminar documento: ${error.message}`,
        timestamp: new Date(),
      }
    }

    return {
      success: true,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error("Error inesperado al eliminar documento:", error)
    return {
      success: false,
      error: `Error inesperado al eliminar documento: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date(),
    }
  }
}

/**
 * Busca documentos según criterios
 */
export async function searchDocuments(params: {
  type?: AIDocumentType
  status?: "draft" | "published" | "archived"
  tags?: string[]
  relatedEntityId?: string
  createdBy?: string
  query?: string
  limit?: number
  offset?: number
}): Promise<AIResult<{ documents: AIDocument[]; total: number }>> {
  try {
    const supabase = getServerSupabaseClient()
    const { type, status, tags, relatedEntityId, createdBy, query, limit = 10, offset = 0 } = params

    // Construir la consulta base
    let queryBuilder = supabase.from("ai_documents").select("*", { count: "exact" })

    // Aplicar filtros
    if (type) queryBuilder = queryBuilder.eq("type", type)
    if (status) queryBuilder = queryBuilder.eq("status", status)
    if (relatedEntityId) queryBuilder = queryBuilder.eq("related_entity_id", relatedEntityId)
    if (createdBy) queryBuilder = queryBuilder.eq("created_by", createdBy)

    // Filtrar por tags si se proporcionan
    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.contains("tags", tags)
    }

    // Búsqueda de texto si se proporciona una consulta
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%, content.ilike.%${query}%`)
    }

    // Aplicar paginación
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    // Ordenar por fecha de actualización descendente
    queryBuilder = queryBuilder.order("updated_at", { ascending: false })

    // Ejecutar la consulta
    const { data, error, count } = await queryBuilder

    if (error) {
      return {
        success: false,
        error: `Error al buscar documentos: ${error.message}`,
        timestamp: new Date(),
      }
    }

    // Convertir los resultados a la interfaz AIDocument
    const documents: AIDocument[] = data.map((item) => ({
      id: item.id,
      type: item.type as AIDocumentType,
      title: item.title,
      content: item.content,
      metadata: item.metadata,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      createdBy: item.created_by,
      relatedEntityId: item.related_entity_id,
      tags: item.tags,
      status: item.status,
      version: item.version,
    }))

    return {
      success: true,
      data: {
        documents,
        total: count || 0,
      },
      timestamp: new Date(),
    }
  } catch (error) {
    console.error("Error inesperado al buscar documentos:", error)
    return {
      success: false,
      error: `Error inesperado al buscar documentos: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date(),
    }
  }
}
