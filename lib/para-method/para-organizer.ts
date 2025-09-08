export interface PARACategory {
  id: string
  name: string
  description: string
  color: string
  icon: string
  subcategories: PARASubcategory[]
}

export interface PARASubcategory {
  id: string
  name: string
  description: string
  rules: string[]
}

export interface PARAClassification {
  category: "projects" | "areas" | "resources" | "archive"
  subcategory: string
  priority: "high" | "medium" | "low"
  status: string
  dueDate?: string
  tags: string[]
}

export class PARAOrganizer {
  private categories: Record<string, PARACategory> = {
    projects: {
      id: "projects",
      name: "PROYECTOS ACTIVOS",
      description: "Casos inmobiliarios con fechas límite específicas y resultados definidos",
      color: "text-red-600 bg-red-50 border-red-200",
      icon: "Target",
      subcategories: [
        {
          id: "active-sales",
          name: "Ventas en Proceso",
          description: "Propiedades en proceso activo de venta",
          rules: [
            "Tiene cliente interesado identificado",
            "Documentación en proceso",
            "Fecha estimada de cierre definida",
          ],
        },
        {
          id: "pending-docs",
          name: "Pendiente Documentación",
          description: "Casos esperando documentos específicos",
          rules: ["Falta documentación legal", "Esperando aprobaciones", "Requiere firmas o validaciones"],
        },
        {
          id: "ready-to-close",
          name: "Listo para Cierre",
          description: "Casos completos listos para finalizar",
          rules: ["Toda documentación completa", "Partes listas para firmar", "Proceso de cierre iniciado"],
        },
      ],
    },
    areas: {
      id: "areas",
      name: "ÁREAS DE RESPONSABILIDAD",
      description: "Actividades continuas sin fecha límite específica",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      icon: "Building",
      subcategories: [
        {
          id: "client-management",
          name: "Gestión de Clientes",
          description: "Relaciones y comunicaciones continuas con clientes",
          rules: ["Comunicaciones regulares", "Seguimiento de leads", "Mantenimiento de relaciones"],
        },
        {
          id: "marketing",
          name: "Marketing Inmobiliario",
          description: "Promoción y marketing de propiedades",
          rules: ["Material promocional", "Fotografías y videos", "Campañas publicitarias"],
        },
        {
          id: "legal-compliance",
          name: "Cumplimiento Legal",
          description: "Mantenimiento de documentación legal actualizada",
          rules: ["Documentos legales vigentes", "Cumplimiento normativo", "Actualizaciones regulatorias"],
        },
      ],
    },
    resources: {
      id: "resources",
      name: "RECURSOS DE REFERENCIA",
      description: "Información y herramientas para consulta futura",
      color: "text-green-600 bg-green-50 border-green-200",
      icon: "BookOpen",
      subcategories: [
        {
          id: "templates",
          name: "Plantillas y Formularios",
          description: "Documentos modelo reutilizables",
          rules: ["Contratos tipo", "Formularios estándar", "Plantillas de comunicación"],
        },
        {
          id: "market-data",
          name: "Datos de Mercado",
          description: "Información de precios y tendencias",
          rules: ["Estudios de mercado", "Comparables de precios", "Análisis de tendencias"],
        },
        {
          id: "contacts",
          name: "Directorio Profesional",
          description: "Contactos de profesionales del sector",
          rules: ["Abogados especializados", "Tasadores certificados", "Otros profesionales"],
        },
      ],
    },
    archive: {
      id: "archive",
      name: "ARCHIVO",
      description: "Proyectos completados y documentación histórica",
      color: "text-gray-600 bg-gray-50 border-gray-200",
      icon: "Archive",
      subcategories: [
        {
          id: "completed-sales",
          name: "Ventas Completadas",
          description: "Casos cerrados exitosamente",
          rules: ["Venta finalizada", "Documentación completa", "Proceso cerrado"],
        },
        {
          id: "cancelled-projects",
          name: "Proyectos Cancelados",
          description: "Casos que no se concretaron",
          rules: ["Proceso cancelado", "Cliente retirado", "Condiciones no cumplidas"],
        },
        {
          id: "historical-data",
          name: "Datos Históricos",
          description: "Información de referencia histórica",
          rules: ["Más de 2 años de antigüedad", "Valor de referencia únicamente", "Conservación por regulación"],
        },
      ],
    },
  }

  classifyFolder(folderName: string, folderContents: any[]): PARAClassification {
    const name = folderName.toUpperCase()
    const hasActiveIndicators = this.hasActiveProjectIndicators(name, folderContents)
    const hasCompletionIndicators = this.hasCompletionIndicators(name, folderContents)
    const isHistorical = this.isHistoricalData(name, folderContents)

    // Lógica de clasificación inteligente
    if (isHistorical || hasCompletionIndicators) {
      return {
        category: "archive",
        subcategory: hasCompletionIndicators ? "completed-sales" : "historical-data",
        priority: "low",
        status: "archived",
        tags: this.extractTags(name, folderContents),
      }
    }

    if (hasActiveIndicators) {
      const subcategory = this.determineProjectSubcategory(name, folderContents)
      return {
        category: "projects",
        subcategory,
        priority: this.determinePriority(name, folderContents),
        status: "active",
        dueDate: this.extractDueDate(name, folderContents),
        tags: this.extractTags(name, folderContents),
      }
    }

    // Clasificar como área o recurso basado en contenido
    if (this.isResourceContent(name, folderContents)) {
      return {
        category: "resources",
        subcategory: this.determineResourceSubcategory(name, folderContents),
        priority: "medium",
        status: "reference",
        tags: this.extractTags(name, folderContents),
      }
    }

    return {
      category: "areas",
      subcategory: this.determineAreaSubcategory(name, folderContents),
      priority: "medium",
      status: "ongoing",
      tags: this.extractTags(name, folderContents),
    }
  }

  private hasActiveProjectIndicators(name: string, contents: any[]): boolean {
    const activeKeywords = ["PROCESO", "VENTA", "COMPRA", "NEGOCIACION", "2025", "2024"]
    const hasRecentFiles = contents.some((file) => {
      const fileDate = new Date(file.modifiedTime || file.createdTime)
      const monthsAgo = (Date.now() - fileDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      return monthsAgo < 6 // Archivos modificados en los últimos 6 meses
    })

    return activeKeywords.some((keyword) => name.includes(keyword)) || hasRecentFiles
  }

  private hasCompletionIndicators(name: string, contents: any[]): boolean {
    const completionKeywords = ["COMPLETADO", "FINALIZADO", "CERRADO", "VENDIDO"]
    return completionKeywords.some((keyword) => name.includes(keyword))
  }

  private isHistoricalData(name: string, contents: any[]): boolean {
    const historicalYears = ["2023", "2022", "2021", "2020"]
    const hasOldFiles = contents.some((file) => {
      const fileDate = new Date(file.modifiedTime || file.createdTime)
      const yearsAgo = (Date.now() - fileDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      return yearsAgo > 2
    })

    return historicalYears.some((year) => name.includes(year)) || hasOldFiles
  }

  private determineProjectSubcategory(name: string, contents: any[]): string {
    if (name.includes("PENDIENTE") || name.includes("ESPERANDO")) return "pending-docs"
    if (name.includes("LISTO") || name.includes("CIERRE")) return "ready-to-close"
    return "active-sales"
  }

  private isResourceContent(name: string, contents: any[]): boolean {
    const resourceKeywords = ["TEMPLATE", "PLANTILLA", "MODELO", "FORMATO", "DATOS", "PRECIOS"]
    return resourceKeywords.some((keyword) => name.includes(keyword))
  }

  private determineResourceSubcategory(name: string, contents: any[]): string {
    if (name.includes("TEMPLATE") || name.includes("PLANTILLA")) return "templates"
    if (name.includes("PRECIO") || name.includes("MERCADO")) return "market-data"
    if (name.includes("CONTACTO") || name.includes("DIRECTORIO")) return "contacts"
    return "templates"
  }

  private determineAreaSubcategory(name: string, contents: any[]): string {
    if (name.includes("CLIENTE") || name.includes("COMUNICACION")) return "client-management"
    if (name.includes("MARKETING") || name.includes("PROMOCION")) return "marketing"
    if (name.includes("LEGAL") || name.includes("DOCUMENTO")) return "legal-compliance"
    return "client-management"
  }

  private determinePriority(name: string, contents: any[]): "high" | "medium" | "low" {
    if (name.includes("URGENTE") || name.includes("PRIORITARIO")) return "high"
    if (name.includes("NORMAL") || name.includes("REGULAR")) return "medium"
    return "low"
  }

  private extractDueDate(name: string, contents: any[]): string | undefined {
    // Buscar fechas en el nombre de la carpeta
    const dateMatch = name.match(/(\d{4}[-_]\d{2}[-_]\d{2})/)
    if (dateMatch) {
      return dateMatch[1].replace(/_/g, "-")
    }
    return undefined
  }

  private extractTags(name: string, contents: any[]): string[] {
    const tags: string[] = []

    // Extraer ubicación
    const locations = ["PUCON", "TEMUCO", "VALDIVIA", "OSORNO", "PUERTO_MONTT"]
    locations.forEach((location) => {
      if (name.includes(location)) tags.push(location)
    })

    // Extraer tipo de propiedad
    const propertyTypes = ["CASA", "PARCELA", "TERRENO", "DEPARTAMENTO", "CAMPO"]
    propertyTypes.forEach((type) => {
      if (name.includes(type)) tags.push(type)
    })

    // Extraer números de rol
    const rolMatch = name.match(/ROL[_\s]*(\d+)/i)
    if (rolMatch) tags.push(`ROL_${rolMatch[1]}`)

    return tags
  }

  getCategories(): Record<string, PARACategory> {
    return this.categories
  }

  getCategoryStats(folders: any[]): Record<string, number> {
    const stats = {
      projects: 0,
      areas: 0,
      resources: 0,
      archive: 0,
    }

    folders.forEach((folder) => {
      const classification = this.classifyFolder(folder.name, folder.contents || [])
      stats[classification.category]++
    })

    return stats
  }
}
