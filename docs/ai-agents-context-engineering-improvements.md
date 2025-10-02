# Mejoras de Context Engineering para Agentes IA - Sur-Realista

**Basado en**: [Effective context engineering for AI agents - Anthropic](https://share.google/TeZFlkvJAnlMOywI6)

## Resumen Ejecutivo

Este documento analiza los 6 agentes IA actuales del proyecto Sur-Realista y propone mejoras específicas basadas en las mejores prácticas de "context engineering" de Anthropic. El objetivo es mejorar la precisión, confiabilidad y eficiencia de nuestros agentes sin romper funcionalidad existente.

---

## Conceptos Clave de Context Engineering

### 1. Context Rot (Degradación de Contexto)
**Problema**: A medida que aumenta el número de tokens en la ventana de contexto, la capacidad del modelo para recordar información disminuye.

**Aplicación a Sur-Realista**: Nuestros agentes procesan documentos largos y múltiples archivos. Debemos curar cuidadosamente qué información incluir en cada llamada al LLM.

### 2. Attention Budget (Presupuesto de Atención)
**Problema**: Los LLMs tienen capacidad limitada de atención, similar a la memoria de trabajo humana.

**Aplicación a Sur-Realista**: Cada token adicional reduce la capacidad del modelo de enfocarse en información crítica. Debemos priorizar tokens de alto valor.

### 3. Context Engineering vs Prompt Engineering
**Diferencia**: 
- **Prompt Engineering**: Escribir instrucciones óptimas (tarea discreta)
- **Context Engineering**: Curar y mantener el conjunto óptimo de tokens durante toda la inferencia (proceso iterativo)

**Aplicación a Sur-Realista**: Nuestros agentes operan en múltiples turnos y procesan grandes volúmenes de datos. Necesitamos estrategias para refinar cíclicamente el contexto.

---

## Análisis de Agentes Actuales

### 1. DocumentOrchestrator (`lib/agents/orchestrator.ts`)

**Función Actual**: Coordina todos los agentes, maneja colas de tareas con prioridades, procesa en paralelo.

**Fortalezas**:
- Sistema de prioridades (high/medium/low)
- Tracking de estado de tareas
- Agregación de resultados con confidence scoring

**Oportunidades de Mejora**:

#### A. Selección Dinámica de Contexto
\`\`\`typescript
// ACTUAL: Routing básico de tareas
async processTask(task: Task) {
  const agent = this.selectAgent(task.type)
  return agent.execute(task)
}

// PROPUESTA: Context-aware routing
async processTask(task: Task) {
  // Analizar complejidad de la tarea
  const complexity = this.analyzeTaskComplexity(task)
  
  // Seleccionar contexto óptimo basado en complejidad
  const context = this.selectOptimalContext({
    task,
    complexity,
    availableTokens: this.getAvailableTokenBudget(),
    recentHistory: this.getRelevantHistory(task, maxTokens: 1000)
  })
  
  // Ejecutar con contexto curado
  const agent = this.selectAgent(task.type)
  return agent.execute(task, context)
}
\`\`\`

#### B. Context Pruning (Poda de Contexto)
\`\`\`typescript
// PROPUESTA: Mantener solo contexto relevante entre tareas
class ContextManager {
  private contextWindow: ContextItem[] = []
  private readonly MAX_TOKENS = 8000 // Reservar espacio para respuesta
  
  addContext(item: ContextItem) {
    this.contextWindow.push(item)
    this.pruneIfNeeded()
  }
  
  private pruneIfNeeded() {
    const totalTokens = this.calculateTokens(this.contextWindow)
    
    if (totalTokens > this.MAX_TOKENS) {
      // Estrategia: Mantener items más recientes y de mayor prioridad
      this.contextWindow = this.contextWindow
        .sort((a, b) => {
          // Priorizar por: recency * priority * relevance
          return (b.timestamp * b.priority * b.relevance) - 
                 (a.timestamp * a.priority * a.relevance)
        })
        .slice(0, this.calculateOptimalSize())
    }
  }
}
\`\`\`

---

### 2. ValidationAgent (`lib/agents/validation-agent.ts`)

**Función Actual**: Valida estructura de carpetas, convenciones de nombres, completitud de contenido.

**Fortalezas**:
- Validación contra estándar de 6 categorías
- Scoring de compliance
- Generación de recomendaciones

**Oportunidades de Mejora**:

#### A. Few-Shot Examples en Prompts
\`\`\`typescript
// ACTUAL: Validación basada en reglas
const validateStructure = (folder: Folder) => {
  return folder.hasRequiredCategories()
}

// PROPUESTA: Validación con ejemplos contextuales
const VALIDATION_PROMPT = `
Valida la estructura de carpetas de propiedades inmobiliarias chilenas.

ESTRUCTURA ESTÁNDAR:
- 01_Documentos_Legales/
- 02_Documentos_Financieros/
- 03_Fotos_Videos/
- 04_Planos_Mediciones/
- 05_Marketing/
- 06_Comunicaciones/

EJEMPLOS DE ESTRUCTURAS CORRECTAS:

Ejemplo 1 - Propiedad Completa:
✓ 01_Documentos_Legales/
  - Escritura_Propiedad_ROL_12345.pdf
  - Certificado_Dominio_Vigente.pdf
✓ 02_Documentos_Financieros/
  - Avaluo_Fiscal_2024.pdf
  - Contribuciones_Pagadas.pdf
✓ 03_Fotos_Videos/
  - Exterior_Fachada_01.jpg
  - Interior_Living_01.jpg
✓ 04_Planos_Mediciones/
  - Plano_Arquitectura.pdf
✓ 05_Marketing/
  - Ficha_Tecnica.pdf
✓ 06_Comunicaciones/
  - Emails_Cliente.pdf

Ejemplo 2 - Errores Comunes:
✗ Documentos_Legales/ (falta numeración)
✗ 01_Legal/ (nombre incorrecto)
✗ Fotos/ (falta numeración y categoría completa)
✗ archivos_sueltos.pdf (fuera de carpetas)

TAREA: Analiza la siguiente estructura y proporciona:
1. Lista de carpetas faltantes
2. Carpetas con nombres incorrectos
3. Archivos fuera de lugar
4. Score de compliance (0-100%)
5. Recomendaciones específicas

ESTRUCTURA A VALIDAR:
{folder_structure}
`
\`\`\`

#### B. Contextual Validation Rules
\`\`\`typescript
// PROPUESTA: Reglas de validación con contexto
interface ValidationContext {
  propertyType: 'casa' | 'departamento' | 'terreno' | 'comercial'
  transactionType: 'venta' | 'arriendo'
  region: string
  requiredDocuments: string[]
}

const validateWithContext = (folder: Folder, context: ValidationContext) => {
  // Ajustar validación según contexto
  const rules = getContextualRules(context)
  
  // Ejemplo: Terrenos no requieren planos de arquitectura interior
  if (context.propertyType === 'terreno') {
    rules.optional.push('Plano_Interior')
  }
  
  // Ejemplo: Arriendos requieren certificados adicionales
  if (context.transactionType === 'arriendo') {
    rules.required.push('Certificado_Deudas_Comunes')
  }
  
  return validateAgainstRules(folder, rules)
}
\`\`\`

---

### 3. DocumentAgent (`lib/agents/document-agent.ts`)

**Función Actual**: Clasifica documentos por tipo (legal, financiero, marketing, foto, comunicación).

**Fortalezas**:
- Confidence scoring
- Routing sugerido
- Extracción de metadata

**Oportunidades de Mejora**:

#### A. Rich Document Examples
\`\`\`typescript
// PROPUESTA: Clasificación con ejemplos ricos
const DOCUMENT_CLASSIFICATION_PROMPT = `
Clasifica documentos de propiedades inmobiliarias chilenas.

EJEMPLOS DE CLASIFICACIÓN:

1. DOCUMENTOS LEGALES:
   - "Escritura_Publica_Compraventa_ROL_12345-67.pdf"
     → Tipo: Legal, Subtipo: Escritura, Confidence: 0.95
   - "Certificado_Dominio_Vigente_CBR_2024.pdf"
     → Tipo: Legal, Subtipo: Certificado, Confidence: 0.98
   - "Informe_Titulo_Propiedad.pdf"
     → Tipo: Legal, Subtipo: Informe, Confidence: 0.90

2. DOCUMENTOS FINANCIEROS:
   - "Avaluo_Fiscal_2024_SII.pdf"
     → Tipo: Financiero, Subtipo: Avalúo, Confidence: 0.97
   - "Contribuciones_1er_Semestre_2024.pdf"
     → Tipo: Financiero, Subtipo: Impuestos, Confidence: 0.95
   - "Gastos_Comunes_Enero_2024.pdf"
     → Tipo: Financiero, Subtipo: Gastos, Confidence: 0.93

3. FOTOS Y VIDEOS:
   - "Exterior_Fachada_Principal_01.jpg"
     → Tipo: Foto, Subtipo: Exterior, Confidence: 0.99
   - "Interior_Living_Comedor_02.jpg"
     → Tipo: Foto, Subtipo: Interior, Confidence: 0.99
   - "Video_Recorrido_Virtual.mp4"
     → Tipo: Video, Subtipo: Tour, Confidence: 0.98

4. CASOS AMBIGUOS:
   - "Documento_Propiedad.pdf" (nombre genérico)
     → Requiere análisis de contenido
     → Confidence: 0.60 (bajo por ambigüedad)
   - "IMG_20240115_143022.jpg" (nombre automático)
     → Requiere análisis de imagen
     → Confidence: 0.50 (bajo por falta de contexto)

ESTRATEGIA PARA CASOS AMBIGUOS:
1. Analizar contenido del archivo (primeras líneas de texto)
2. Buscar palabras clave (ROL, SII, CBR, Escritura, Avalúo)
3. Considerar ubicación en estructura de carpetas
4. Si confidence < 0.70, marcar para revisión manual

DOCUMENTO A CLASIFICAR:
Nombre: {filename}
Ubicación: {folder_path}
Primeras líneas: {content_preview}
`
\`\`\`

#### B. Multi-Signal Classification
\`\`\`typescript
// PROPUESTA: Clasificación con múltiples señales
interface ClassificationSignals {
  filename: string
  folderPath: string
  contentPreview: string
  fileExtension: string
  fileSize: number
  creationDate: Date
  metadata?: Record<string, any>
}

const classifyDocument = async (signals: ClassificationSignals) => {
  // Señal 1: Análisis de nombre (rápido, bajo costo)
  const nameClassification = classifyByName(signals.filename)
  
  if (nameClassification.confidence > 0.85) {
    return nameClassification // Alta confianza, no necesitamos más contexto
  }
  
  // Señal 2: Análisis de ubicación (sin costo adicional)
  const locationClassification = classifyByLocation(signals.folderPath)
  
  // Señal 3: Análisis de contenido (solo si necesario, mayor costo)
  if (nameClassification.confidence < 0.70) {
    const contentClassification = await classifyByContent({
      preview: signals.contentPreview,
      nameHint: nameClassification.type,
      locationHint: locationClassification.type
    })
    
    // Combinar señales con pesos
    return combineClassifications([
      { result: nameClassification, weight: 0.3 },
      { result: locationClassification, weight: 0.2 },
      { result: contentClassification, weight: 0.5 }
    ])
  }
  
  return combineClassifications([
    { result: nameClassification, weight: 0.6 },
    { result: locationClassification, weight: 0.4 }
  ])
}
\`\`\`

---

### 4. ExtractionAgent (`lib/agents/extraction-agent.ts`)

**Función Actual**: Extrae datos estructurados (ROL, fechas, montos) de documentos.

**Fortalezas**:
- Extracción de ROL (IDs de propiedades chilenas)
- Extracción de fechas y montos
- Agregación de confianza multi-fuente

**Oportunidades de Mejora**:

#### A. Structured Output with Schema
\`\`\`typescript
// PROPUESTA: Extracción con schema estructurado
import { z } from 'zod'

const PropertyDataSchema = z.object({
  rol: z.object({
    numero: z.string().regex(/^\d{1,5}-\d{1,4}$/),
    comuna: z.string(),
    confidence: z.number().min(0).max(1)
  }),
  fechas: z.object({
    escritura: z.string().datetime().optional(),
    inscripcion: z.string().datetime().optional(),
    avaluo: z.string().datetime().optional()
  }),
  montos: z.object({
    avaluoFiscal: z.number().positive().optional(),
    precioVenta: z.number().positive().optional(),
    contribuciones: z.number().positive().optional()
  }),
  ubicacion: z.object({
    direccion: z.string(),
    coordenadas: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }).optional()
  })
})

const EXTRACTION_PROMPT = `
Extrae información estructurada de documentos de propiedades chilenas.

FORMATO DE SALIDA (JSON):
${JSON.stringify(PropertyDataSchema.shape, null, 2)}

EJEMPLOS DE EXTRACCIÓN:

Documento 1: "Escritura Pública de Compraventa"
Texto: "...ROL 12345-67 de la Comuna de Providencia...fecha 15 de marzo de 2024...precio de $250.000.000..."

Salida:
{
  "rol": {
    "numero": "12345-67",
    "comuna": "Providencia",
    "confidence": 0.95
  },
  "fechas": {
    "escritura": "2024-03-15T00:00:00Z"
  },
  "montos": {
    "precioVenta": 250000000
  }
}

Documento 2: "Certificado de Avalúo Fiscal"
Texto: "...Rol de Avalúo N° 98765-4321...Avalúo Fiscal: $180.500.000...Vigencia: 2024..."

Salida:
{
  "rol": {
    "numero": "98765-4321",
    "comuna": "",
    "confidence": 0.90
  },
  "fechas": {
    "avaluo": "2024-01-01T00:00:00Z"
  },
  "montos": {
    "avaluoFiscal": 180500000
  }
}

CASOS ESPECIALES:

1. ROL con formato alternativo:
   - "ROL: 1234567" → Normalizar a "12345-67"
   - "Rol 12345 - 67" → Normalizar a "12345-67"

2. Montos con formato chileno:
   - "$250.000.000" → 250000000
   - "UF 8.500" → Convertir a pesos (usar valor UF actual)

3. Fechas en español:
   - "15 de marzo de 2024" → "2024-03-15T00:00:00Z"
   - "Marzo 2024" → "2024-03-01T00:00:00Z" (primer día del mes)

DOCUMENTO A PROCESAR:
{document_text}
`
\`\`\`

#### B. Incremental Extraction with Context
\`\`\`typescript
// PROPUESTA: Extracción incremental con contexto acumulado
class IncrementalExtractor {
  private extractedData: Partial<PropertyData> = {}
  private contextHistory: string[] = []
  
  async extractFromDocument(document: Document) {
    // Construir contexto con datos ya extraídos
    const context = this.buildContext()
    
    // Extraer solo información faltante o de baja confianza
    const missingFields = this.identifyMissingFields()
    
    const prompt = `
    CONTEXTO PREVIO:
    ${context}
    
    CAMPOS FALTANTES O DE BAJA CONFIANZA:
    ${missingFields.join(', ')}
    
    DOCUMENTO ACTUAL:
    ${document.text}
    
    TAREA: Extrae SOLO los campos faltantes. No repitas información ya extraída con alta confianza.
    `
    
    const newData = await this.llm.extract(prompt)
    
    // Merge con datos existentes, priorizando alta confianza
    this.extractedData = this.mergeWithConfidence(
      this.extractedData,
      newData
    )
    
    // Actualizar historial de contexto (mantener solo últimos 3 documentos)
    this.contextHistory.push(document.summary)
    if (this.contextHistory.length > 3) {
      this.contextHistory.shift()
    }
    
    return this.extractedData
  }
  
  private buildContext(): string {
    return `
    Datos extraídos hasta ahora:
    - ROL: ${this.extractedData.rol?.numero || 'No encontrado'} (confidence: ${this.extractedData.rol?.confidence || 0})
    - Dirección: ${this.extractedData.ubicacion?.direccion || 'No encontrada'}
    - Avalúo: ${this.extractedData.montos?.avaluoFiscal || 'No encontrado'}
    
    Documentos procesados: ${this.contextHistory.join(' → ')}
    `
  }
}
\`\`\`

---

### 5. FolderAgent (`lib/agents/folder-agent.ts`)

**Función Actual**: Analiza y organiza estructuras de carpetas, verifica compliance.

**Fortalezas**:
- Análisis contra estándares
- Checking de carpetas faltantes/extra
- Generación de recomendaciones
- Cálculo de score (0-100%)

**Oportunidades de Mejora**:

#### A. Contextual Folder Examples
\`\`\`typescript
// PROPUESTA: Análisis con ejemplos de carpetas bien organizadas
const FOLDER_ANALYSIS_PROMPT = `
Analiza la estructura de carpetas de propiedades inmobiliarias.

EJEMPLOS DE ESTRUCTURAS BIEN ORGANIZADAS:

Ejemplo 1: Casa en Venta - Estructura Completa (Score: 100%)
📁 Propiedad_Casa_Providencia_ROL_12345-67/
  📁 01_Documentos_Legales/
    📄 Escritura_Propiedad_2020.pdf
    📄 Certificado_Dominio_Vigente_2024.pdf
    📄 Informe_Titulo_Abogado.pdf
  📁 02_Documentos_Financieros/
    📄 Avaluo_Fiscal_2024.pdf
    📄 Contribuciones_2024_Pagadas.pdf
    📄 Gastos_Comunes_Ultimo_Año.pdf
  📁 03_Fotos_Videos/
    📁 Exteriores/
      📄 Fachada_01.jpg
      📄 Fachada_02.jpg
      📄 Jardin_01.jpg
    📁 Interiores/
      📄 Living_01.jpg
      📄 Cocina_01.jpg
      📄 Dormitorio_Principal_01.jpg
  📁 04_Planos_Mediciones/
    📄 Plano_Arquitectura.pdf
    📄 Certificado_Superficie_DOM.pdf
  📁 05_Marketing/
    📄 Ficha_Tecnica.pdf
    📄 Descripcion_Propiedad.docx
  📁 06_Comunicaciones/
    📄 Emails_Cliente_2024.pdf

Ejemplo 2: Departamento en Arriendo - Estructura Mínima (Score: 75%)
📁 Depto_Las_Condes_ROL_98765-43/
  📁 01_Documentos_Legales/
    📄 Certificado_Dominio.pdf
  📁 02_Documentos_Financieros/
    📄 Gastos_Comunes.pdf
  📁 03_Fotos_Videos/
    📄 Living_01.jpg
    📄 Cocina_01.jpg
  ⚠️ FALTA: 04_Planos_Mediciones/
  ⚠️ FALTA: 05_Marketing/
  📁 06_Comunicaciones/
    📄 Contrato_Arriendo.pdf

Ejemplo 3: Estructura con Errores (Score: 40%)
📁 Casa_Santiago/  ❌ Falta ROL en nombre
  📁 Documentos/  ❌ Sin numeración ni categoría
    📄 escritura.pdf  ❌ Nombre no descriptivo
    📄 fotos.zip  ❌ Archivo comprimido, debería estar descomprimido
  📄 avaluo.pdf  ❌ Archivo suelto, debería estar en carpeta
  📁 Fotos/  ❌ Sin numeración
    📄 IMG_001.jpg  ❌ Nombre automático, no descriptivo

CRITERIOS DE SCORING:

1. Estructura Base (40 puntos):
   - Carpeta raíz con nombre descriptivo + ROL: 10 pts
   - 6 carpetas principales numeradas: 30 pts (5 pts c/u)

2. Contenido Mínimo (30 puntos):
   - Documentos legales básicos: 10 pts
   - Documentos financieros básicos: 10 pts
   - Fotos mínimas (5+): 10 pts

3. Organización (20 puntos):
   - Nombres descriptivos de archivos: 10 pts
   - Subcarpetas lógicas: 5 pts
   - Sin archivos sueltos: 5 pts

4. Completitud (10 puntos):
   - Todos los documentos esperados: 10 pts
   - Documentos faltantes: -2 pts c/u

ESTRUCTURA A ANALIZAR:
{folder_structure}

PROPORCIONA:
1. Score total (0-100)
2. Desglose de puntos por categoría
3. Lista de problemas encontrados
4. Recomendaciones específicas de mejora
5. Prioridad de cada recomendación (Alta/Media/Baja)
`
\`\`\`

#### B. Progressive Folder Organization
\`\`\`typescript
// PROPUESTA: Organización progresiva con feedback
class ProgressiveFolderOrganizer {
  async organizeFolder(folder: Folder) {
    // Paso 1: Análisis inicial (contexto mínimo)
    const initialAnalysis = await this.analyzeStructure(folder, {
      depth: 'shallow',
      includeContent: false
    })
    
    if (initialAnalysis.score > 90) {
      return initialAnalysis // Ya está bien organizada
    }
    
    // Paso 2: Análisis profundo solo si es necesario
    const deepAnalysis = await this.analyzeStructure(folder, {
      depth: 'deep',
      includeContent: true,
      focusAreas: initialAnalysis.problemAreas
    })
    
    // Paso 3: Generar plan de reorganización
    const reorganizationPlan = await this.generatePlan({
      currentStructure: folder,
      analysis: deepAnalysis,
      targetScore: 95
    })
    
    // Paso 4: Ejecutar plan con validación incremental
    for (const step of reorganizationPlan.steps) {
      await this.executeStep(step)
      
      // Validar después de cada paso
      const validation = await this.validateStep(step)
      
      if (!validation.success) {
        // Ajustar plan basado en feedback
        reorganizationPlan = await this.adjustPlan(
          reorganizationPlan,
          validation.feedback
        )
      }
    }
    
    return this.getFinalAnalysis(folder)
  }
}
\`\`\`

---

### 6. SIIBrowserAgent (`lib/agents/sii-browser-agent.ts`)

**Función Actual**: Automatización web para extraer datos del SII (Servicio de Impuestos Internos chileno).

**Fortalezas**:
- Automatización con Playwright
- Llenado de formularios
- Extracción de coordenadas de mapas
- Cálculo de avalúo realista

**Oportunidades de Mejora**:

#### A. LLM-Based Page Understanding
\`\`\`typescript
// ACTUAL: Selectores DOM hardcodeados
const extractData = async (page: Page) => {
  const rol = await page.$eval('#rol-input', el => el.textContent)
  const avaluo = await page.$eval('.avaluo-value', el => el.textContent)
  return { rol, avaluo }
}

// PROPUESTA: Comprensión de página con LLM
const extractDataWithLLM = async (page: Page) => {
  // Capturar estructura de la página
  const pageStructure = await page.evaluate(() => {
    return {
      title: document.title,
      headings: Array.from(document.querySelectorAll('h1, h2, h3'))
        .map(h => h.textContent),
      labels: Array.from(document.querySelectorAll('label'))
        .map(l => ({ text: l.textContent, for: l.getAttribute('for') })),
      tables: Array.from(document.querySelectorAll('table'))
        .map(t => t.outerHTML.substring(0, 500)) // Primeros 500 chars
    }
  })
  
  // Usar LLM para entender la estructura
  const understanding = await llm.analyze(`
    Analiza esta página del SII (Servicio de Impuestos Internos de Chile).
    
    ESTRUCTURA DE LA PÁGINA:
    ${JSON.stringify(pageStructure, null, 2)}
    
    TAREA:
    1. Identifica dónde está el número de ROL
    2. Identifica dónde está el avalúo fiscal
    3. Identifica dónde están las coordenadas (si existen)
    4. Proporciona selectores CSS para extraer cada dato
    
    FORMATO DE RESPUESTA:
    {
      "rol": { "selector": "...", "confidence": 0.95 },
      "avaluo": { "selector": "...", "confidence": 0.90 },
      "coordenadas": { "selector": "...", "confidence": 0.85 }
    }
  `)
  
  // Extraer datos usando selectores identificados por LLM
  const data = {}
  for (const [field, info] of Object.entries(understanding)) {
    if (info.confidence > 0.80) {
      data[field] = await page.$eval(info.selector, el => el.textContent)
    }
  }
  
  return data
}
\`\`\`

#### B. Resilient Extraction with Fallbacks
\`\`\`typescript
// PROPUESTA: Extracción resiliente con múltiples estrategias
class ResilientSIIExtractor {
  private strategies = [
    this.extractBySelectors,
    this.extractByLabels,
    this.extractByPatterns,
    this.extractByLLM
  ]
  
  async extract(page: Page, field: string) {
    for (const strategy of this.strategies) {
      try {
        const result = await strategy(page, field)
        
        if (result.confidence > 0.85) {
          console.log(`[v0] Extracted ${field} using ${strategy.name}`)
          return result
        }
      } catch (error) {
        console.log(`[v0] Strategy ${strategy.name} failed for ${field}:`, error)
        continue
      }
    }
    
    throw new Error(`Failed to extract ${field} with all strategies`)
  }
  
  private async extractBySelectors(page: Page, field: string) {
    // Estrategia 1: Selectores conocidos (rápido, bajo costo)
    const selectors = this.getKnownSelectors(field)
    for (const selector of selectors) {
      const value = await page.$(selector)
      if (value) {
        return { value, confidence: 0.95, strategy: 'selectors' }
      }
    }
    throw new Error('No selector matched')
  }
  
  private async extractByLabels(page: Page, field: string) {
    // Estrategia 2: Buscar por etiquetas (medio costo)
    const labelText = this.getExpectedLabel(field)
    const value = await page.evaluate((label) => {
      const labelEl = Array.from(document.querySelectorAll('label'))
        .find(l => l.textContent.includes(label))
      if (labelEl) {
        const inputId = labelEl.getAttribute('for')
        return document.getElementById(inputId)?.value
      }
    }, labelText)
    
    if (value) {
      return { value, confidence: 0.85, strategy: 'labels' }
    }
    throw new Error('No label matched')
  }
  
  private async extractByPatterns(page: Page, field: string) {
    // Estrategia 3: Buscar por patrones de texto (medio costo)
    const pattern = this.getFieldPattern(field)
    const value = await page.evaluate((regex) => {
      const text = document.body.textContent
      const match = text.match(new RegExp(regex))
      return match ? match[1] : null
    }, pattern)
    
    if (value) {
      return { value, confidence: 0.75, strategy: 'patterns' }
    }
    throw new Error('No pattern matched')
  }
  
  private async extractByLLM(page: Page, field: string) {
    // Estrategia 4: Usar LLM (alto costo, última opción)
    const pageText = await page.evaluate(() => document.body.textContent)
    
    const result = await llm.extract(`
      Extrae el campo "${field}" de este texto del SII:
      
      ${pageText.substring(0, 2000)}
      
      Campo a extraer: ${field}
      Formato esperado: ${this.getExpectedFormat(field)}
    `)
    
    return { value: result, confidence: 0.70, strategy: 'llm' }
  }
}
\`\`\`

---

## Estrategias Generales de Mejora

### 1. Token Budget Management

\`\`\`typescript
// PROPUESTA: Sistema de gestión de presupuesto de tokens
class TokenBudgetManager {
  private readonly TOTAL_BUDGET = 100000 // tokens por día
  private readonly RESERVED_FOR_RESPONSES = 0.3 // 30% reservado para respuestas
  private usedToday = 0
  
  async allocateForTask(task: Task): Promise<TokenAllocation> {
    const available = this.TOTAL_BUDGET * (1 - this.RESERVED_FOR_RESPONSES) - this.usedToday
    
    // Priorizar tareas según importancia
    const priority = this.calculatePriority(task)
    const allocation = this.calculateAllocation(available, priority)
    
    return {
      maxInputTokens: allocation.input,
      maxOutputTokens: allocation.output,
      strategy: allocation.strategy // 'full' | 'summarized' | 'minimal'
    }
  }
  
  private calculateAllocation(available: number, priority: number) {
    if (priority === 'high' && available > 10000) {
      return {
        input: 8000,
        output: 2000,
        strategy: 'full'
      }
    } else if (available > 3000) {
      return {
        input: 2000,
        output: 1000,
        strategy: 'summarized'
      }
    } else {
      return {
        input: 500,
        output: 500,
        strategy: 'minimal'
      }
    }
  }
}
\`\`\`

### 2. Context Summarization

\`\`\`typescript
// PROPUESTA: Resumir contexto largo antes de pasar al LLM
class ContextSummarizer {
  async summarizeIfNeeded(context: string, maxTokens: number): Promise<string> {
    const tokenCount = this.estimateTokens(context)
    
    if (tokenCount <= maxTokens) {
      return context // No necesita resumen
    }
    
    // Estrategia de resumen progresivo
    if (tokenCount <= maxTokens * 2) {
      // Resumen ligero: eliminar detalles redundantes
      return this.lightSummarize(context, maxTokens)
    } else {
      // Resumen agresivo: extraer solo información clave
      return this.aggressiveSummarize(context, maxTokens)
    }
  }
  
  private async lightSummarize(context: string, maxTokens: number): Promise<string> {
    // Mantener: títulos, primeras oraciones, datos estructurados
    // Eliminar: ejemplos repetitivos, explicaciones largas
    
    const sections = this.splitIntoSections(context)
    const summarized = sections.map(section => ({
      title: section.title,
      summary: section.sentences[0], // Primera oración
      keyData: this.extractKeyData(section)
    }))
    
    return this.formatSummarized(summarized)
  }
  
  private async aggressiveSummarize(context: string, maxTokens: number): Promise<string> {
    // Usar LLM para resumir (costo adicional pero necesario)
    return await llm.summarize(`
      Resume el siguiente contexto a máximo ${maxTokens} tokens.
      Mantén SOLO información crítica para la tarea.
      
      CONTEXTO:
      ${context}
      
      RESUMEN:
    `)
  }
}
\`\`\`

### 3. Caching de Contexto

\`\`\`typescript
// PROPUESTA: Cachear contexto reutilizable
class ContextCache {
  private cache = new Map<string, CachedContext>()
  
  async getOrCompute(key: string, computer: () => Promise<string>): Promise<string> {
    const cached = this.cache.get(key)
    
    if (cached && !this.isStale(cached)) {
      console.log(`[v0] Using cached context for ${key}`)
      return cached.content
    }
    
    console.log(`[v0] Computing fresh context for ${key}`)
    const content = await computer()
    
    this.cache.set(key, {
      content,
      timestamp: Date.now(),
      hits: 0
    })
    
    return content
  }
  
  private isStale(cached: CachedContext): boolean {
    const MAX_AGE = 1000 * 60 * 60 // 1 hora
    return Date.now() - cached.timestamp > MAX_AGE
  }
}

// Uso en agentes
const validationContext = await contextCache.getOrCompute(
  'validation-rules-v1',
  async () => {
    // Computar reglas de validación (costoso)
    return await loadValidationRules()
  }
)
\`\`\`

### 4. Prompt Chaining

\`\`\`typescript
// PROPUESTA: Encadenar prompts para tareas complejas
class PromptChain {
  async executeChain(task: ComplexTask) {
    // Paso 1: Análisis inicial (contexto mínimo)
    const analysis = await llm.analyze({
      prompt: this.buildAnalysisPrompt(task),
      maxTokens: 1000
    })
    
    // Paso 2: Extracción de datos (contexto enfocado)
    const extraction = await llm.extract({
      prompt: this.buildExtractionPrompt(task, analysis),
      maxTokens: 2000,
      context: analysis.relevantSections // Solo secciones relevantes
    })
    
    // Paso 3: Validación (contexto mínimo)
    const validation = await llm.validate({
      prompt: this.buildValidationPrompt(extraction),
      maxTokens: 500,
      context: extraction.summary // Solo resumen
    })
    
    // Paso 4: Generación de recomendaciones (contexto curado)
    const recommendations = await llm.generate({
      prompt: this.buildRecommendationPrompt(validation),
      maxTokens: 1500,
      context: {
        analysis: analysis.summary,
        extraction: extraction.keyFindings,
        validation: validation.issues
      }
    })
    
    return {
      analysis,
      extraction,
      validation,
      recommendations
    }
  }
}
\`\`\`

---

## Plan de Implementación

### Fase 1: Mejoras de Bajo Impacto (1-2 semanas)

1. **Agregar Few-Shot Examples a Prompts**
   - ValidationAgent: Ejemplos de estructuras correctas/incorrectas
   - DocumentAgent: Ejemplos de clasificación
   - ExtractionAgent: Ejemplos de extracción
   
2. **Implementar Token Budget Tracking**
   - Logging de uso de tokens por agente
   - Alertas cuando se excede presupuesto
   
3. **Agregar Context Summarization Básica**
   - Resumir documentos largos antes de procesar
   - Mantener solo primeras N líneas para análisis inicial

### Fase 2: Mejoras de Impacto Medio (2-4 semanas)

1. **Implementar Structured Output con Schemas**
   - Definir schemas Zod para todos los agentes
   - Validar outputs contra schemas
   
2. **Agregar Multi-Signal Classification**
   - Combinar señales de nombre, ubicación, contenido
   - Implementar confidence scoring robusto
   
3. **Implementar Context Caching**
   - Cachear reglas de validación
   - Cachear ejemplos de clasificación
   - Cachear estructuras estándar

### Fase 3: Mejoras Avanzadas (4-8 semanas)

1. **Implementar Incremental Extraction**
   - Extraer datos progresivamente de múltiples documentos
   - Mantener contexto acumulado entre extracciones
   
2. **Implementar LLM-Based Page Understanding**
   - Reemplazar selectores hardcodeados en SIIBrowserAgent
   - Hacer extracción resiliente a cambios en el sitio
   
3. **Implementar Prompt Chaining**
   - Dividir tareas complejas en pasos
   - Pasar solo contexto relevante entre pasos

---

## Métricas de Éxito

### Métricas Actuales (Baseline)
- Precisión de clasificación: 84.7%
- Tasa de extracción exitosa: ~75%
- Tiempo promedio de procesamiento: ~30s por documento
- Uso de tokens: No medido actualmente

### Objetivos Post-Implementación
- Precisión de clasificación: >92%
- Tasa de extracción exitosa: >90%
- Tiempo promedio de procesamiento: <20s por documento
- Reducción de uso de tokens: 30-40%
- Reducción de context rot: Medible por accuracy en documentos largos

---

## Conclusiones

Las mejoras propuestas se basan en principios sólidos de context engineering de Anthropic:

1. **Tratar el contexto como recurso finito**: Implementar token budget management
2. **Curar contexto iterativamente**: Usar context summarization y caching
3. **Priorizar información relevante**: Implementar multi-signal classification
4. **Dividir tareas complejas**: Usar prompt chaining
5. **Validar con schemas**: Usar structured output

Estas mejoras no rompen funcionalidad existente, sino que la extienden y optimizan. La implementación puede ser gradual, empezando por mejoras de bajo impacto y avanzando hacia optimizaciones más sofisticadas.

---

**Última actualización**: 2025-01-10
**Autor**: Sistema Sur-Realista
**Basado en**: [Effective context engineering for AI agents - Anthropic](https://share.google/TeZFlkvJAnlMOywI6)
