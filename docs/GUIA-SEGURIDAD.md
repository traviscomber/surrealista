# Guía de Seguridad - Sur-Realista

## MEJORAS DE SEGURIDAD IMPLEMENTADAS (Jun 5, 2026)

### 1. Monitoreo de Errores con Sentry ✅
- **Qué es**: Sistema de monitoreo que captura errores en producción
- **Cómo funciona**: Todos los errores se envían automáticamente a Sentry
- **Beneficio**: Sabemos qué se está rompiendo EN TIEMPO REAL
- **Ubicación**: `sentry.config.ts`, `lib/sentry-init.ts`, `components/error-boundary.tsx`

**Setup Requerido:**
```bash
# 1. Ir a https://sentry.io y crear una cuenta
# 2. Crear un nuevo proyecto para Next.js
# 3. Copiar el DSN
# 4. Agregar a variables de entorno:
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

**Cómo funciona:**
- Error Boundary captura componentes que fallan
- Excepciones se envían a Sentry automáticamente
- Panel de Sentry muestra todas las alertas

---

### 2. Autenticación Mejorada con Better Auth ✅
- **Qué fue**: Contraseña hardcodeada ("srmagica")
- **Qué es ahora**: Better Auth con email + contraseña segura
- **Mejora**: Contraseñas hasheadas, sesiones seguras, trazabilidad

**Características:**
- ✅ Password hashing con bcrypt (nunca se almacenan en plaintext)
- ✅ Sesiones con token (no localStorage inseguro)
- ✅ Validación de input (email, contraseña fuerte)
- ✅ Protección CSRF
- ✅ Rate limiting (próximamente)
- ✅ Trazabilidad de intentos de login (en Sentry)

**Setup Requerido:**
```bash
# 1. Generar BETTER_AUTH_SECRET
openssl rand -base64 32

# 2. Crear tablas en Supabase (Better Auth las crea automáticamente)
# 3. Agregar variable de entorno:
BETTER_AUTH_SECRET=your_generated_secret
```

**Cómo usar:**
- Reemplazar SecureLogin en lugar del PasswordGate simple
- Login component está en: `components/auth/secure-login.tsx`
- API route en: `app/api/auth/[...all]/route.ts`

---

### 3. Error Boundary con Manejo Graceful ✅
- **Qué es**: Componente que atrapa errores de React y muestra UI amigable
- **Beneficio**: Usuarios no ven pantalla blanca, se notifica al equipo

**Ubicación:** `components/error-boundary.tsx`

**Cómo funciona:**
```jsx
// Uso en layout o página
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

---

## PASOS PARA PRODUCCIÓN

### Paso 1: Configurar Sentry (1 hora)
```bash
# 1. Ir a sentry.io
# 2. Crear proyecto Next.js
# 3. Copiar DSN
# 4. Agregar a Vercel environment variables:
#    NEXT_PUBLIC_SENTRY_DSN=your_dsn
#    SENTRY_ORG=your_org
#    SENTRY_PROJECT=your_project
#    SENTRY_AUTH_TOKEN=your_token
```

### Paso 2: Configurar Better Auth (1-2 horas)
```bash
# 1. Generar secret
openssl rand -base64 32

# 2. Agregar a Vercel environment:
#    BETTER_AUTH_SECRET=your_secret
#    NEXT_PUBLIC_APP_URL=https://sur-realista.vercel.app

# 3. Test en staging:
npm run dev
# Ir a http://localhost:3000/auth/signin (nuevo endpoint)
```

### Paso 3: Reemplazar PasswordGate en Producción (30 min)
```tsx
// En app/layout.tsx
// ANTES:
<PasswordGate>{children}</PasswordGate>

// DESPUÉS:
<SessionProvider>
  <AuthGate>{children}</AuthGate>
</SessionProvider>
```

### Paso 4: Testing (1 hora)
- [ ] Test login con email válido
- [ ] Test login con contraseña incorrecta
- [ ] Test contraseña débil (< 8 chars)
- [ ] Test email inválido
- [ ] Verificar error en Sentry
- [ ] Verificar sesión persiste en reload

---

## CHECKLISTS DE SEGURIDAD

### Antes de cualquier usuario externo:
- [ ] Sentry DSN configurado
- [ ] Better Auth secret generado
- [ ] HTTPS habilitado (Vercel por defecto)
- [ ] Rate limiting en API (próxima fase)
- [ ] Input validation en todos los formularios

### Antes de Beta Limitada:
- [ ] 2FA (factor de autenticación) - próxima fase
- [ ] Logs de auditoría configurados
- [ ] Backup automático de base de datos
- [ ] Monitoreo de uptime

### Antes de Producción Pública:
- [ ] Penetration testing
- [ ] Security headers (CSP, X-Frame-Options, etc)
- [ ] Rate limiting completado
- [ ] DDoS protection (Cloudflare)

---

## VARIABLES DE ENTORNO REQUERIDAS

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/yyyy
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=sntrys_xxx

# Better Auth
BETTER_AUTH_SECRET=your-secret-from-openssl
NEXT_PUBLIC_APP_URL=https://sur-realista.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Node
NODE_ENV=production
```

---

## MONITOREO EN PRODUCCIÓN

### Qué monitorear:
1. **Sentry Dashboard**: https://sentry.io
   - Errores en tiempo real
   - Stack traces automáticos
   - Performance metrics

2. **Vercel Analytics**: https://vercel.com
   - Uptime
   - Performance
   - Build status

3. **Supabase Console**: https://supabase.com
   - Database health
   - API usage
   - Logs

### Alertas a configurar:
- [ ] Error rate > 5% en Sentry
- [ ] API latency > 1s
- [ ] Database connections > 80%
- [ ] Failed deployments

---

## INCIDENT RESPONSE

Si algo sale mal en producción:

1. **Paso 1 - Alertar** (1 min)
   - Revisar Sentry para detalles
   - Notificar al equipo en Slack

2. **Paso 2 - Investigar** (5-10 min)
   - ¿Cuántos usuarios afectados?
   - ¿Desde cuándo?
   - ¿Patrón común?

3. **Paso 3 - Mitigar** (10-30 min)
   - Rollback si es necesario
   - Fix rápido y deploy
   - Comunicar a usuarios

4. **Paso 4 - Post-mortem** (después)
   - Revisar logs
   - Implementar prevención
   - Documentar lección

---

## PREGUNTAS FRECUENTES

**P: ¿Qué pasa si alguien adivina la contraseña?**
A: Con Better Auth y bcrypt, adivinar es prácticamente imposible. Además, hay rate limiting en desarrollo.

**P: ¿Cómo reseteo mi contraseña?**
A: Próxima fase: agregar "forgot password" con email de reset.

**P: ¿Qué datos ve Sentry?**
A: Solo errores, stack traces y contexto. NO ve datos sensibles (mejor-auth los encripta).

**P: ¿Es seguro usar Supabase?**
A: Sí, Supabase usa PostgreSQL con Row Level Security. Datos encriptados en tránsito (HTTPS).

---

## RECURSOS

- [Sentry Docs](https://docs.sentry.io/)
- [Better Auth Docs](https://www.better-auth.com/)
- [OWASP Security Guidelines](https://owasp.org/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/deploying#security)

---

**Última actualización:** 5 de Junio de 2026
**Status:** Mejoras de seguridad implementadas ✅ Listo para beta
