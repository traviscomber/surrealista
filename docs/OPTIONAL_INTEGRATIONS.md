# Integraciones Opcionales

Este documento describe las integraciones externas opcionales del sistema Sur-Realista.

## Variables de Entorno Opcionales

Las siguientes variables de entorno son **OPCIONALES** y solo necesarias si deseas integrar con servicios externos reales. El sistema funciona completamente sin ellas usando datos de demostración.

### CIREN (Centro de Información de Recursos Naturales)
\`\`\`
CIREN_API_KEY=tu_clave_api
CIREN_API_URL=https://api.ciren.cl
\`\`\`

**Estado**: Opcional - El sistema usa datos de demostración si no está configurado.

**Funcionalidad**: Búsqueda de empresas, datos financieros, análisis de riesgo.

### SIRENE (Sistema de Información de Empresas)
\`\`\`
SIRENE_API_URL=https://api.sirene.cl/v1
SIRENE_API_KEY=tu_clave_api
\`\`\`

**Estado**: Opcional - El sistema usa datos de demostración si no está configurado.

**Funcionalidad**: Información de empresas inmobiliarias, análisis de mercado, competidores.

### SII (Servicio de Impuestos Internos)
\`\`\`
SII_API_URL=https://api.sii.cl
SII_API_KEY=tu_clave_api
SII_USER_TOKEN=tu_token_usuario
\`\`\`

**Estado**: Opcional - Funcionalidad deshabilitada si no está configurado.

**Funcionalidad**: Datos de propiedades, contribuciones, transacciones, valoraciones comerciales.

## Funcionamiento sin Integraciones

El sistema Sur-Realista está diseñado para funcionar completamente sin estas integraciones:

1. **CIREN**: Usa base de datos de demostración con empresas chilenas realistas
2. **SIRENE**: Retorna datos simulados de empresas inmobiliarias
3. **SII**: Retorna mensajes informativos indicando que la funcionalidad estará disponible en Etapa 2

## Integraciones Requeridas

Las siguientes integraciones SÍ son necesarias para el funcionamiento del sistema:

- **Supabase**: Base de datos principal (ya configurado)
- **OpenAI**: Para funcionalidades de IA (opcional pero recomendado)

## Conclusión

Puedes **omitir completamente** las variables CIREN_API_KEY, CIREN_API_URL, SIRENE_API_URL, SIRENE_API_KEY, SII_API_URL, SII_API_KEY y SII_USER_TOKEN. El sistema funcionará perfectamente sin ellas.
