# Sur Realista — Sistema de diseño

> Fuente principal: sitio público oficial `sur-realista.cl`, revisado el 3 de agosto de 2026.
>
> Este documento convierte la identidad observable del sitio público en reglas operativas para el producto interno. Distingue entre evidencia directa, medición visual y decisiones de producto derivadas. No reemplaza un manual corporativo original en formatos editables si este aparece posteriormente.

## 1. Estado y autoridad

### 1.1 Jerarquía de fuentes

1. Activos oficiales de Sur Realista: logotipo, isotipo, fotografías, mapas y piezas corporativas.
2. Sitio público oficial `sur-realista.cl`.
3. Este archivo `DESIGN.md`.
4. Tokens del repositorio.
5. Decisiones locales de componentes.

Cuando exista conflicto, prevalece la fuente de mayor nivel.

### 1.2 Nivel de certeza

- **Confirmado:** contenido, arquitectura, lenguaje, imágenes, jerarquía editorial y patrones visibles en el sitio público.
- **Observado:** proporciones, contraste, densidad, uso de blanco, tono natural y tratamiento fotográfico.
- **Operativo:** valores de implementación definidos aquí para mantener consistencia en la aplicación.
- **Pendiente de activo original:** equivalencias exactas Pantone, CMYK, RGB, familia tipográfica licenciada y zonas de seguridad oficiales del logotipo.

## 2. Identidad de marca

### 2.1 Propósito

Sur Realista trabaja sobre tierra, territorio, naturaleza y formas de habitar. La marca comunica experiencia inmobiliaria y arquitectónica sin separarse del paisaje ni convertir el territorio en un producto genérico.

### 2.2 Oferta principal observada

- Corretaje de campos.
- Desarrollo de proyectos y planes maestros.
- Arquitectura.
- Búsqueda y asesoría de propiedades.
- Cobertura territorial desde Valparaíso hasta Magallanes.

### 2.3 Personalidad

- Territorial.
- Sobria.
- Natural.
- Profesional.
- Editorial.
- Cercana sin informalidad.
- Premium por calidad, escala y fotografía; no por decoración.

### 2.4 Mensajes centrales

- Relación estrecha con el entorno.
- Cuidado del territorio.
- Patrimonio natural.
- Experiencia integral y multidisciplinaria.
- Baja densidad, conservación y calidad de vida.
- Oportunidad inmobiliaria con contexto geográfico real.

## 3. Principios visuales

1. **La tierra y la fotografía mandan.** La interfaz debe acompañar el contenido territorial, no competir con él.
2. **El blanco es parte de la marca.** El sitio público usa amplitud, respiración y superficies claras como base editorial.
3. **Contraste alto y tranquilo.** Texto oscuro sobre fondos claros; color reservado para jerarquía, estados y marca.
4. **Naturaleza sin clichés.** Evitar verdes saturados, texturas falsas, hojas decorativas o estética eco genérica.
5. **Editorial antes que dashboard.** Titulares amplios, ritmo vertical, imágenes grandes y datos bien espaciados.
6. **La información geográfica es protagonista.** Mapas, región, localidad, superficie, precio y atributos naturales deben leerse primero.
7. **Pocas capas visuales.** Fondo, panel y elemento interactivo. Evitar card dentro de card.
8. **Premium sobrio.** Sin neón, glassmorphism excesivo, gradientes tecnológicos ni sombras pesadas.

## 4. Logotipo e isotipo

### 4.1 Activos observados

El sitio utiliza al menos:

- logotipo principal Sur Realista;
- isotipo independiente;
- versión de logo centrada;
- versiones a color para pie de página y secciones corporativas.

### 4.2 Reglas de uso

- Usar archivos vectoriales oficiales cuando estén disponibles.
- No redibujar, inclinar, condensar, expandir ni aplicar efectos.
- No introducir fondos circulares o rectangulares no existentes en el activo.
- Mantener contraste suficiente respecto al fondo.
- En navegación, usar una versión horizontal compacta.
- En portadas o bloques institucionales, permitir composición centrada con mayor aire.

### 4.3 Área de protección operativa

Hasta disponer del manual original, usar una zona libre mínima equivalente a la altura de la letra “S” alrededor del conjunto.

### 4.4 Tamaños mínimos

- Navegación desktop: altura visual de 24–32 px.
- Pie de página: 32–52 px.
- Isotipo UI: 18–24 px.
- No usar el logo completo por debajo de 96 px de ancho.

## 5. Color

### 5.1 Dirección cromática observada

La identidad pública se apoya en:

- fondos blancos y marfil muy claro;
- texto carbón;
- verdes naturales apagados;
- tonos tierra y piedra;
- fotografía real como principal fuente de color.

La aplicación interna no debe usar una interfaz casi negra como identidad principal. El modo oscuro puede existir como preferencia funcional, pero debe derivarse de la marca clara y mantener contraste WCAG.

### 5.2 Tokens operativos — tema claro principal

Estos valores son la implementación base del producto y deben validarse contra activos originales cuando estén disponibles.

```css
:root {
  --sr-canvas: 42 24% 97%;          /* #FAF9F6 */
  --sr-surface: 0 0% 100%;          /* #FFFFFF */
  --sr-surface-subtle: 42 18% 94%;  /* #F3F1EC */
  --sr-surface-muted: 40 13% 90%;   /* #E9E6DF */

  --sr-ink: 156 13% 14%;            /* #1F2824 */
  --sr-ink-soft: 150 7% 31%;        /* #4A5550 */
  --sr-ink-muted: 145 5% 45%;       /* #6D7772 */
  --sr-ink-inverse: 0 0% 100%;      /* #FFFFFF */

  --sr-green: 151 20% 35%;          /* #47705C */
  --sr-green-strong: 153 24% 25%;   /* #304F41 */
  --sr-green-soft: 145 17% 83%;     /* #CEDBD2 */

  --sr-earth: 31 25% 43%;           /* #896C52 */
  --sr-earth-soft: 33 27% 84%;      /* #DED2C4 */
  --sr-water: 195 22% 46%;          /* #5C8290 */
  --sr-forest: 137 23% 31%;         /* #3D6248 */

  --sr-border: 145 8% 82%;          /* #CDD3CF */
  --sr-border-strong: 148 8% 66%;   /* #A1ACA6 */
  --sr-focus: 151 32% 34%;          /* #3B7356 */

  --sr-success: 150 45% 34%;
  --sr-warning: 35 72% 43%;
  --sr-danger: 7 62% 47%;
  --sr-info: 198 44% 42%;
}
```

### 5.3 Tema oscuro funcional

El tema oscuro no es una inversión automática ni la identidad principal. Debe conservar separación y contraste:

```css
.dark {
  --sr-canvas: 156 12% 9%;          /* #141A17 */
  --sr-surface: 154 11% 13%;        /* #1D2521 */
  --sr-surface-subtle: 151 9% 17%;  /* #27302C */
  --sr-surface-muted: 150 8% 22%;   /* #333C38 */

  --sr-ink: 45 18% 94%;             /* #F3F1EA */
  --sr-ink-soft: 45 9% 78%;         /* #CBC8BF */
  --sr-ink-muted: 45 6% 66%;        /* #ABA89F */
  --sr-ink-inverse: 156 13% 14%;

  --sr-green: 145 27% 63%;
  --sr-green-strong: 145 33% 72%;
  --sr-green-soft: 148 13% 29%;

  --sr-border: 150 8% 29%;
  --sr-border-strong: 148 8% 42%;
  --sr-focus: 145 37% 66%;
}
```

### 5.4 Reglas de contraste

- Texto normal: mínimo 4.5:1.
- Texto grande: mínimo 3:1.
- Controles, iconos y estados: mínimo 3:1 respecto al fondo.
- No usar texto beige, gris claro o blanco sobre tarjetas claras.
- No comunicar calidad o porcentaje solo mediante color.
- Badges deben tener texto oscuro sobre fondos claros o texto blanco sobre fondos suficientemente oscuros.

### 5.5 Uso de color

- Verde: marca, selección principal, acciones positivas y naturaleza.
- Tierra: metadatos territoriales, agrícola y rural.
- Azul apagado: agua, lagos, ríos y costa.
- Rojo: error, riesgo o destrucción; nunca selección normal.
- Naranja: advertencia real; no usar como decoración permanente.

## 6. Tipografía

### 6.1 Dirección observada

El sitio usa una voz editorial limpia, con titulares amplios y texto de lectura cómoda. La aplicación debe evitar fuentes monoespaciadas, pixeladas o de apariencia tecnológica como estilo principal.

### 6.2 Familia operativa

Hasta identificar la fuente oficial exacta:

```css
--font-display: "Helvetica Neue", "Neue Haas Grotesk", Arial, sans-serif;
--font-body: "Helvetica Neue", Inter, Arial, sans-serif;
--font-mono: "SFMono-Regular", Consolas, monospace;
```

No incorporar una fuente externa nueva sin revisar licencia, rendimiento y similitud con la web pública.

### 6.3 Escala desktop

| Token | Tamaño | Línea | Peso | Uso |
|---|---:|---:|---:|---|
| Display XL | 64 px | 1.02 | 400–500 | Hero institucional |
| Display L | 48 px | 1.08 | 400–500 | Titular de sección pública |
| H1 producto | 28 px | 1.15 | 600 | Título de pantalla |
| H2 | 22 px | 1.2 | 600 | Sección principal |
| H3 | 17 px | 1.3 | 600 | Grupo o panel |
| Body L | 18 px | 1.55 | 400 | Introducción editorial |
| Body | 15 px | 1.5 | 400 | Texto normal |
| UI | 14 px | 1.35 | 500 | Controles y navegación |
| Small | 12 px | 1.4 | 500 | Metadatos |
| Micro | 11 px | 1.35 | 600 | Etiquetas breves |

### 6.4 Reglas

- No usar menos de 12 px para información necesaria.
- Evitar `font-weight: 300` en interfaces operativas.
- Usar mayúsculas solo en etiquetas cortas y con tracking moderado.
- No usar títulos enteros en mayúsculas.
- Limitar cuerpo editorial a 60–75 caracteres por línea.

## 7. Espaciado y grid

### 7.1 Unidad base

Usar una escala de 4 px:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`.

### 7.2 Layout público

- Contenedor principal: 1200–1320 px.
- Márgenes laterales desktop: 48–80 px.
- Secciones editoriales: 80–144 px verticales.
- Imágenes de proyecto: grandes, sin marcos innecesarios.

### 7.3 Layout de producto CAMPOS

- Header global: 56–64 px.
- Header de módulo: 44–52 px.
- Panel izquierdo: 320–360 px.
- Panel de detalle: 420–480 px.
- Rail intermedio: máximo 40 px.
- Mapa: siempre recibe el espacio restante.
- Padding de panel: 16–24 px.
- Separación entre grupos: 20–32 px.

## 8. Radios, bordes y sombras

### 8.1 Radios

```css
--radius-xs: 4px;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-pill: 999px;
```

- Inputs y botones: 6–10 px.
- Paneles: 0–12 px según contexto.
- Cards editoriales: 0–8 px.
- Badges: pill.
- No usar radios de 20–32 px en cada bloque.

### 8.2 Bordes

- Usar 1 px, color `--sr-border`.
- Bordes estructurales, no decorativos.
- Evitar borde completo cuando basta separación por espacio o un divisor.

### 8.3 Sombras

```css
--shadow-float: 0 12px 32px -20px rgb(31 40 36 / 0.35);
--shadow-overlay: 0 24px 64px -28px rgb(31 40 36 / 0.45);
```

No usar sombra en paneles fijos. Reservarla para popovers, menús, tooltips y elementos flotantes sobre mapa.

## 9. Fotografía y contenido visual

### 9.1 Estilo observado

- Paisaje real del sur de Chile.
- Luz natural.
- Escala territorial amplia.
- Vegetación, agua, arquitectura y topografía reales.
- Color natural, sin filtros tecnológicos.
- Uso editorial a gran formato.

### 9.2 Reglas

- No aplicar overlays oscuros fuertes salvo necesidad de texto.
- No saturar verdes o azules.
- No usar imágenes IA cuando exista fotografía real del proyecto.
- Mantener horizonte, escala y contexto territorial.
- Evitar recortes que eliminen el entorno y conviertan el campo en un objeto aislado.
- Nunca “mejorar” una referencia alterando luz, textura o color sin instrucción explícita.

### 9.3 Aspect ratios

- Hero: 16:9 o 21:9.
- Proyecto editorial: 4:3, 3:2 o vertical 4:5.
- Card de propiedad: 4:3.
- Avatar de equipo: 3:4 o 1:1 según activo original.

## 10. Iconografía

- Estilo lineal, sobrio y consistente.
- Grosor recomendado: 1.5–2 px.
- Tamaño UI normal: 16–20 px.
- Evitar iconos rellenos, brillantes o multicolor.
- Los iconos deben acompañar una acción o categoría real.
- Usar texto junto al icono en acciones no universales.

## 11. Navegación

### 11.1 Sitio público

La navegación observada agrupa:

- Home.
- Quiénes somos.
- Nuestro equipo.
- Corretaje.
- Lista de campos.
- Proyectos.
- Arquitectura.
- Portafolio.
- Contacto.

### 11.2 Producto interno

- Una sola navegación global.
- CAMPOS debe ser la vista operativa principal.
- Evitar barras duplicadas para la misma jerarquía.
- Mantener nombre del módulo, búsqueda global y acciones principales visibles.
- Región es el primer filtro territorial.
- Tags son filtros transversales dentro de la región.

## 12. Botones y acciones

### 12.1 Primario

- Fondo `--sr-green-strong`.
- Texto blanco.
- Altura 40–44 px.
- Padding horizontal 16–20 px.
- Una acción primaria por contexto.

### 12.2 Secundario

- Fondo transparente o `--sr-surface`.
- Borde `--sr-border-strong`.
- Texto `--sr-ink`.

### 12.3 Ghost

- Sin borde permanente.
- Hover con `--sr-surface-subtle`.
- Para acciones auxiliares y navegación local.

### 12.4 Destructivo

- Solo para eliminar, revocar o descartar de manera irreversible.
- Requiere confirmación cuando afecte datos.

### 12.5 Estados

- Hover: cambio perceptible de fondo o borde.
- Active: contraste estable, no solo una sombra.
- Focus: anillo de 2 px con `--sr-focus`.
- Disabled: menor énfasis, pero texto legible.
- Loading: conservar ancho y etiqueta contextual.

## 13. Formularios

- Etiqueta siempre visible.
- Placeholder no reemplaza label.
- Altura mínima 40 px.
- Texto mínimo 14 px.
- Error bajo el campo, con explicación específica.
- Fondo blanco en tema claro; superficie elevada en oscuro.
- Bordes neutros; color semántico solo en estado.
- Formularios públicos deben mantener tono directo y humano.

## 14. Cards y listas

### 14.1 Propiedades públicas

Jerarquía recomendada:

1. Fotografía.
2. Nombre del campo.
3. Ubicación y región.
4. Superficie.
5. Precio.
6. Atributos diferenciales.
7. Acción de contacto.

### 14.2 Listas internas

- Filas de 44–56 px.
- Nombre legible antes que badges.
- Máximo tres badges visibles.
- Región y estado como metadatos secundarios.
- Selección con fondo verde muy suave y borde o indicador lateral.
- Nunca usar naranja y rojo simultáneamente como decoración masiva.

## 15. Badges y tags

### 15.1 Jerarquía

1. Región y ubicación.
2. Uso de suelo.
3. Agua y entorno.
4. Acceso y cercanía.
5. Tipo de geometría.
6. Calidad o estado técnico.

### 15.2 Presentación

- Ocultar prefijos técnicos en la UI.
- Ejemplo: `suelo:agricola` → `Agrícola`.
- Altura: 22–26 px.
- Texto: 11–12 px, peso 600.
- Máximo tres por fila.
- Los porcentajes técnicos no deben aparecer sin etiqueta explicativa.

### 15.3 Paleta semántica

- Suelo: tierra suave.
- Agua: azul apagado.
- Entorno: verde suave.
- Acceso: gris piedra.
- Calidad alta: verde.
- Advertencia: ámbar.
- Error: rojo.
- Sin datos: gris neutro, nunca rojo.

## 16. Mapas y geometrías

### 16.1 Prioridad

El mapa es la superficie principal de CAMPOS. Debe conservar legibilidad territorial y no convertirse en un fondo decorativo.

### 16.2 Base cartográfica

- Mapa de calles/topografía como base principal.
- Satélite como alternativa.
- En modo oscuro, no aplicar filtros CSS que destruyan nombres, caminos, agua o relieve.
- Preferir tiles diseñados para oscuro cuando se requiera.

### 16.3 Polígonos reales

- Borde: 2–2.5 px.
- Relleno: 12–22% de opacidad.
- Hover: aumentar relleno y borde.
- Selección: 3 px, contraste claro y halo moderado.
- El color debe distinguir archivos sin generar arcoíris saturado.

### 16.4 Líneas y tracks

- Grosor: 2–3 px.
- No interpretar una línea abierta como polígono.
- Mostrar tipo de geometría claramente.

### 16.5 Referencias aproximadas

- Línea discontinua.
- Relleno máximo 4–6%.
- Etiqueta visible: `Ubicación referencial`.
- Nunca presentar bounds o centro SII como límite predial.

### 16.6 Controles

- Agrupados en una zona estable.
- Altura 32–36 px.
- Fondo de alto contraste con el mapa.
- No superponer barra de filtros y controles.
- Capas, zoom, pantalla completa y geometrías deben seguir un mismo lenguaje.

## 17. Vista CAMPOS desktop

### 17.1 Estructura

- Header global.
- Panel izquierdo de regiones y archivos.
- Mapa central flexible.
- Panel derecho de detalle al seleccionar.
- Barra contextual de región y tags sobre el mapa, sin tapar controles.

### 17.2 Panel izquierdo

- Búsqueda arriba.
- Resumen breve, no cuatro tarjetas pálidas sin contraste.
- Regiones como primer nivel.
- Campos dentro de región.
- Nombre completo accesible por tooltip cuando trunca.
- Badges técnicos subordinados.

### 17.3 Panel derecho

Orden de lectura:

1. Nombre y región.
2. ROL.
3. Estado de geometría.
4. Suelo, agua, acceso y cercanía.
5. Propietario.
6. Documentos.
7. SII e investigación.
8. Acciones de edición.

No usar seis tabs comprimidos en una sola línea si las etiquetas dejan de ser legibles. Usar 3–4 secciones principales o navegación vertical compacta.

### 17.4 Contraste obligatorio

- Panel claro: texto `--sr-ink`.
- Panel oscuro: texto `--sr-ink` del tema oscuro.
- No mantener tarjetas blancas dentro de un shell oscuro sin propósito.
- No aplicar colores inline que ignoren tokens.
- Todo override de CAMPOS debe tener variante `.dark` o usar variables semánticas.

## 18. Estados vacíos, carga y error

### Vacío

- Explicar qué falta.
- Indicar la siguiente acción posible.
- No usar ilustraciones genéricas grandes.

### Carga

- Mantener estructura de la pantalla.
- Mostrar progreso real cuando se renderizan muchas geometrías.
- Evitar overlays opacos que oculten todo el mapa.

### Error

- Mensaje específico.
- Diferenciar error de red, permisos, geometría y datos incompletos.
- Mantener acceso a la información que sí está disponible.

## 19. Movimiento

- Duración UI: 120–220 ms.
- Curva: `ease-out` para entrada, `ease-in-out` para cambios de estado.
- Evitar rebotes y movimientos llamativos.
- Respetar `prefers-reduced-motion`.
- No animar polígonos de forma permanente.

## 20. Accesibilidad

- WCAG 2.2 AA como mínimo.
- Navegación completa por teclado.
- Focus visible en todos los controles.
- Áreas clicables mínimas de 36 × 36 px en desktop.
- Labels accesibles para controles del mapa.
- No depender exclusivamente del color.
- Tooltips no deben ser la única fuente de información esencial.
- Orden DOM coherente con el orden visual.

## 21. Voz y redacción

### 21.1 Tono público

- Claro.
- Humano.
- Territorial.
- Profesional.
- Evita superlativos vacíos.
- Describe atributos concretos: ubicación, agua, bosque, acceso, superficie y paisaje.

### 21.2 Tono interno

- Directo y operativo.
- Estados honestos: `Sin geometría real`, `Ubicación referencial`, `Propietario pendiente`.
- Evitar nombres genéricos como `Información` o `Datos` cuando se puede ser específico.

### 21.3 Convenciones

- `ha` para hectáreas en UI compacta; `hectáreas` en texto editorial.
- `UF 15.000`, no combinaciones inconsistentes.
- `Región de Los Lagos`, sin números romanos en nuevas interfaces salvo fuente original.
- Usar español de Chile.

## 22. Contenido estructural del sitio público

La identidad pública se organiza alrededor de:

- introducción corporativa;
- gestión y desarrollo inmobiliario;
- proyectos propios;
- corretaje;
- métricas de trayectoria;
- propiedades destacadas;
- arquitectura y planes maestros;
- equipo, misión y visión;
- contacto y presencia territorial.

La aplicación interna debe mantener esa conexión: CAMPOS no es un GIS genérico; es la herramienta territorial de una empresa de corretaje, proyectos y arquitectura.

## 23. Antipatrones prohibidos

- Paleta tecnológica negra con rojo neón como identidad principal.
- Texto claro sobre tarjetas claras.
- Colores hex rígidos que ignoran tema.
- Cuatro o más niveles de superficies.
- Card dentro de card sin función.
- Sombras en todos los paneles.
- Iconos brillantes o decorativos.
- Fuentes pixeladas o monoespaciadas como voz de marca.
- Badges naranjos y rojos en cada fila.
- Tabs ilegibles por exceso de opciones.
- Mapa lavado por filtros CSS.
- Referencias aproximadas representadas como polígonos reales.
- Fotografías sobresaturadas o “mejoradas” sin autorización.

## 24. Tokens recomendados para Tailwind/shadcn

Los tokens globales deben mapearse así:

```css
:root {
  --background: var(--sr-canvas);
  --foreground: var(--sr-ink);
  --card: var(--sr-surface);
  --card-foreground: var(--sr-ink);
  --popover: var(--sr-surface);
  --popover-foreground: var(--sr-ink);
  --primary: var(--sr-green-strong);
  --primary-foreground: var(--sr-ink-inverse);
  --secondary: var(--sr-surface-subtle);
  --secondary-foreground: var(--sr-ink);
  --muted: var(--sr-surface-subtle);
  --muted-foreground: var(--sr-ink-muted);
  --accent: var(--sr-green-soft);
  --accent-foreground: var(--sr-green-strong);
  --border: var(--sr-border);
  --input: var(--sr-border);
  --ring: var(--sr-focus);
}
```

No duplicar paletas por componente. CAMPOS, administración, búsqueda y páginas públicas deben consumir los mismos tokens semánticos.

## 25. Checklist de revisión

Antes de aprobar una pantalla:

- [ ] ¿Se reconoce Sur Realista sin depender solo del logo?
- [ ] ¿La geografía o fotografía sigue siendo protagonista?
- [ ] ¿El contraste cumple AA?
- [ ] ¿El tema oscuro usa tokens y no overrides blancos?
- [ ] ¿Existe una sola acción primaria clara?
- [ ] ¿Región aparece antes que tags en CAMPOS?
- [ ] ¿La geometría real se distingue de una referencia?
- [ ] ¿Los estados técnicos se explican con palabras?
- [ ] ¿Los badges están limitados y subordinados?
- [ ] ¿Se eliminaron cards, bordes y sombras innecesarios?
- [ ] ¿La tipografía es legible y no excesivamente fina?
- [ ] ¿La pantalla fue verificada visualmente en producción?

## 26. Próximos activos requeridos

Para convertir este documento en un manual 100% certificado se deben incorporar:

1. Logo maestro SVG/AI/EPS.
2. Isotipo maestro.
3. Paleta oficial RGB, CMYK y Pantone.
4. Familia tipográfica y licencias.
5. Reglas oficiales de tamaño y área de seguridad.
6. Biblioteca fotográfica aprobada.
7. Plantillas corporativas existentes.
8. Capturas de referencia del sitio público en desktop y móvil.

Hasta entonces, este documento es la fuente operativa obligatoria del repositorio para diseño y desarrollo.