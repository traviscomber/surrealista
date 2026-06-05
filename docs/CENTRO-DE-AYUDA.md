# Centro de Ayuda - Sur-Realista

## Guías, Tutoriales y Preguntas Frecuentes

### Tabla de Contenidos
1. [Primeros Pasos](#primeros-pasos)
2. [Cotizador de Propiedades](#cotizador)
3. [Asistente IA](#asistente-ia)
4. [Búsqueda y Navegación](#busqueda)
5. [Preguntas Frecuentes](#faq)

---

## Primeros Pasos {#primeros-pasos}

### ¿Qué es Sur-Realista?

Sur-Realista es una **plataforma inteligente de valuación y análisis de propiedades inmobiliarias en Chile**. Utiliza:
- Datos reales de la base de datos nacional (SII - Servicio de Impuestos Internos)
- Inteligencia Artificial para análisis de mercado
- Comparables de mercado vigentes
- Análisis de tendencias inmobiliarias

### Requisitos Previos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet
- Ningún software adicional requerido

---

## Cotizador de Propiedades {#cotizador}

### ¿Cómo usar el Cotizador?

1. **Accede al Cotizador**: Ve a `http://localhost:3000/cotizador`
2. **Completa el formulario**:
   - Selecciona el tipo de propiedad (terreno, casa, departamento, etc.)
   - Elige la región de Chile
   - Especifica la ciudad (opcional)
   - Ingresa el área en m²
   - Selecciona el estado de la propiedad
   - Lista las características (piscina, estacionamiento, etc.)
3. **Haz click en "Obtener Valuación"**
4. **Revisa los resultados**

### Tipos de Propiedades Soportadas

- **Terreno**: Lotes sin construcción
- **Casa**: Viviendas unifamiliares
- **Departamento**: Propiedades de múltiples unidades
- **Comercial**: Locales y oficinas
- **Agrícola**: Fundos y propiedades agrícolas
- **Industrial**: Propiedades industriales

### Estados de Propiedad

- **Excelente**: Nueva o recién remodelada
- **Bueno**: Buen estado, sin necesidad de reparaciones
- **Regular**: Requiere algunos arreglos menores
- **Reparación**: Necesita inversión significativa
- **En construcción**: Obra en desarrollo
- **Terreno sin mejoras**: Suelo sin construcción

### ¿Cómo se Calcula la Valuación?

El Cotizador utiliza **3 metodologías**:

1. **Enfoque Comparativo** (Prioridad 1)
   - Analiza propiedades similares recientemente transadas
   - Usa tu base de datos de Properties Enhanced
   - Compara: región, tipo, tamaño y características

2. **Avalúos Fiscales SII** (Prioridad 2)
   - Usa datos del Servicio de Impuestos Internos
   - Avalúos oficiales y verificables
   - Datos históricos y actualizados

3. **Benchmarks de Mercado** (Prioridad 3)
   - Análisis estadístico de mercado regional
   - Comparación con datos de internet vigentes
   - Tendencias históricas

### Interpretación de Resultados

**Valor Estimado**: El precio calculado basado en datos reales
**Rango de Precio**: Variación típica del ±15% del mercado
**Precio/m²**: Valor por metro cuadrado
**Confianza**: Porcentaje basado en calidad de datos (65-95%)

**Comparación de Mercado**:
- Verde (0 a ±10%): Precio alineado con mercado
- Amarillo (10-20%): Propiedad bajo mercado
- Naranja/Rojo (>20%): Propiedad significativamente bajo/sobre mercado

---

## Asistente IA {#asistente-ia}

### ¿Cómo usar el Asistente IA?

1. **Accede al Asistente**: Ve a `http://localhost:3000/asistente-ia`
2. **Haz tu pregunta** sobre propiedades inmobiliarias
3. **El asistente analizará** tu consulta y buscará datos relevantes
4. **Recibirás respuestas** basadas en análisis inteligente

### Tipos de Consultas

**Búsqueda Geográfica**:
- "¿Qué archivos KMZ tengo en Valdivia?"
- "Muestra propiedades en la región de Los Lagos"
- "¿Cuáles son las ciudades con más propiedades?"

**Análisis de Mercado**:
- "¿Cómo está el mercado inmobiliario en Metropolitana?"
- "¿Cuáles son las tendencias de precios en el sur?"
- "¿Qué zonas tienen potencial de inversión?"

**Asesoramiento**:
- "¿Dónde debo invertir en propiedades?"
- "¿Cuáles son las mejores oportunidades actuales?"
- "Analiza el mercado inmobiliario por región"

### Fuentes de Datos del Asistente

- **SII**: Avalúos fiscales reales
- **Properties Enhanced**: Base de datos de propiedades
- **Opportunities**: Análisis de inversión
- **Archivos KMZ**: Ubicaciones geográficas
- **Internet**: Datos de mercado vigente

---

## Búsqueda y Navegación {#busqueda}

### Panel de Búsqueda Principal

El buscador inteligente en la parte superior te permite:
- Buscar propiedades por ubicación
- Acceder a herramientas rápidamente
- Explorar documentación

### Navegación Principal

**Herramientas**:
- Cotizador
- Asistente IA

**Documentación**:
- Centro de Ayuda (este documento)
- Documentación Técnica
- Guías de Usuario
- Documentación IA
- API Reference

---

## Preguntas Frecuentes {#faq}

### General

**P: ¿Es gratis usar Sur-Realista?**
R: Sí, el Cotizador y Asistente IA son completamente gratuitos.

**P: ¿Cómo se actualizan los datos?**
R: Los datos se actualizan automáticamente desde el SII y portales inmobiliarios.

**P: ¿Puedo confiar en las valuaciones?**
R: Las valuaciones son aproximaciones. Para transacciones reales, recomendamos tasaciones oficiales.

### Cotizador

**P: ¿Por qué varía tanto el rango de precio?**
R: El ±15% refleja la variabilidad natural del mercado según características específicas.

**P: ¿Qué significa "Confianza 85%"?**
R: Indica el nivel de seguridad basado en cantidad de comparables analizados.

**P: ¿Cómo se calcula el precio/m²?**
R: Se obtiene dividiendo el valor estimado entre el área en metros cuadrados.

### Asistente IA

**P: ¿Por qué a veces no encuentra datos?**
R: Puede ser que no existan registros para esa ubicación específica.

**P: ¿Cómo formula preguntas el asistente entienda?**
R: Sé específico: menciona región, tipo de propiedad y qué información buscas.

**P: ¿Puede el asistente hacer compras?**
R: No. Es solo para análisis e información, no realiza transacciones.

---

## Soporte y Contacto

Si tienes preguntas adicionales:
- Revisa la [Documentación Técnica](./DOCUMENTACION-TECNICA.md)
- Consulta las [Guías de Usuario](./GUIAS-USUARIO.md)
- Explora la [Documentación IA](./DOCUMENTACION-IA.md)
