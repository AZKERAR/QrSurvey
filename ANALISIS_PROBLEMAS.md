# 📋 ANÁLISIS DE PROBLEMAS - QrSurvey
**Fecha:** 29 de Noviembre 2025  
**Estado:** Funcional en producción con issues pendientes

---

## ✅ FUNCIONALIDADES QUE FUNCIONAN

1. ✅ **Login/Registro** - AuthContext funciona correctamente
2. ✅ **Creación de encuestas** - Se guardan en Supabase
3. ✅ **Agregar preguntas** - SurveyQuestionsPage funcional
4. ✅ **QR Code generation** - Se genera correctamente en producción
5. ✅ **Responder encuestas** - PublicSurveyPage funciona desde móvil
6. ✅ **Eliminación de encuestas** - RLS policies configuradas
7. ✅ **Deploy en Vercel** - Configurado con vercel.json
8. ✅ **Routing SPA** - Rutas dinámicas funcionan

---

## ❌ PROBLEMAS DETECTADOS

### **PROBLEMA 1: Dashboard no muestra gráficos actualizados**

**Síntoma:**
- Al entrar al Dashboard (`/dashboard`), el gráfico muestra `count: 0` aunque haya respuestas
- Al recargar la página (F5) sigue mostrando 0
- Solo muestra datos correctos en `SurveyListPage` (`/surveys`)

**Causa raíz:**
El componente `SurveyChart` carga datos con `useEffect` cuando se monta, pero:
1. No tiene dependencia para recargar cuando cambian las respuestas
2. No hay mecanismo de refresh automático
3. Los datos se cachean en el estado local

**Ubicación del código:**
- `src/modules/dashboard/pages/DashboardPage.tsx` (líneas 50-71)
- `src/modules/surveys/components/SurveyChart.tsx` (líneas 28-130)

**Solución propuesta:**
```typescript
// Opción A: Agregar key prop para forzar remount
<SurveyChart key={Date.now()} surveyId={survey.id} />

// Opción B: Agregar botón de recarga manual
<button onClick={() => loadData()}>🔄 Actualizar</button>

// Opción C: Auto-refresh cada 30 segundos
useEffect(() => {
  const interval = setInterval(loadData, 30000)
  return () => clearInterval(interval)
}, [])
```

---

### **PROBLEMA 2: Navegación inconsistente tras crear encuesta**

**Síntoma:**
- Crear encuesta → Agregar preguntas → Click "Finalizar"
- Debería ir a `/surveys` (lista de encuestas)
- **Comportamiento actual:** Va a `/surveys` correctamente ✅
- **Pero:** No se ve el botón de "Ver resultados" habilitado inmediatamente

**Causa raíz:**
La navegación está correcta (`navigate('/surveys')` en línea 149 de SurveyQuestionsPage), pero:
1. `useSurveys` hook no recarga automáticamente
2. La lista muestra encuestas cacheadas

**Ubicación:**
- `src/modules/surveys/pages/SurveyQuestionsPage.tsx` (línea 149)
- `src/modules/surveys/hooks/useSurveys.ts` (línea 16-45)

**Solución propuesta:**
```typescript
// En handleFinish de SurveyQuestionsPage
navigate('/surveys', { state: { reload: true } })

// En SurveyListPage, detectar y recargar
useEffect(() => {
  if (location.state?.reload) {
    window.location.reload()
  }
}, [location])
```

---

### **PROBLEMA 3: Tooltip en gráficos muestra "count: 0" visualmente**

**Síntoma:**
- Al pasar el mouse sobre las barras del gráfico
- El tooltip muestra "Pizza count: 0" aunque la barra tenga altura
- Confunde al usuario

**Causa raíz:**
El tooltip de Recharts está mostrando el valor incorrecto o hay un problema de sincronización entre los datos y la visualización.

**Ubicación:**
- `src/modules/surveys/components/SurveyChart.tsx` (líneas 172-180)

**Solución propuesta:**
```typescript
<Tooltip
  contentStyle={{
    backgroundColor: '#1a1a2e',
    border: '1px solid #333',
    borderRadius: 4,
    color: '#fff',
  }}
  labelStyle={{ color: '#22c55e' }}
  formatter={(value) => [`${value} respuestas`, '']}
/>
```

---

## 🔧 MEJORAS SUGERIDAS

### **1. Auto-refresh de gráficos**
Implementar Supabase Realtime para actualizar gráficos automáticamente cuando llegan nuevas respuestas.

**Código:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`survey-${surveyId}`)
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'responses' },
      () => loadData()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [surveyId])
```

---

### **2. Loading states mejorados**
Agregar skeletons en lugar de texto "Cargando..."

**Código:**
```typescript
{loading && (
  <div className="skeleton">
    <div className="skeleton-bar"></div>
    <div className="skeleton-bar"></div>
  </div>
)}
```

---

### **3. Cache invalidation en useSurveys**
Forzar recarga cuando se crea/elimina una encuesta.

**Código:**
```typescript
export function useSurveys(forceReload?: boolean) {
  useEffect(() => {
    load()
  }, [user, forceReload])
}
```

---

### **4. Confirmación visual tras crear encuesta**
Mostrar toast/notification después de crear encuesta exitosamente.

---

## 📝 ORDEN DE PRIORIDAD PARA MAÑANA

### **Alta prioridad:**
1. ✅ Arreglar gráficos en Dashboard (agregar key o botón refresh)
2. ✅ Mejorar tooltip de Recharts para mostrar valores correctos

### **Media prioridad:**
3. ⚠️ Implementar auto-refresh cada 30s en SurveyChart
4. ⚠️ Agregar loading skeletons

### **Baja prioridad:**
5. 💡 Supabase Realtime para updates en tiempo real
6. 💡 Toast notifications

---

## 🐛 BUGS MENORES

1. **Cursor en botones:** ✅ RESUELTO (commit e8f9f8a)
2. **404 en rutas SPA:** ✅ RESUELTO (commit d19d1b1 - vercel.json)
3. **RLS policies DELETE:** ✅ RESUELTO (SQL ejecutado)
4. **Deployment protection:** ✅ RESUELTO (Standard Protection)

---

## 📊 ESTADO ACTUAL DEL PROYECTO

**Commits recientes:**
- `e8f9f8a` - Fix: Implementar eliminación de encuestas, corregir cursor y agregar logs detallados
- `d19d1b1` - Add vercel.json para rutas SPA

**Archivos modificados hoy:**
- `src/modules/dashboard/pages/DashboardPage.tsx`
- `src/modules/surveys/pages/SurveyListPage.tsx`
- `src/modules/surveys/pages/SurveyListPage.css`
- `src/modules/surveys/pages/SurveyQuestionsPage.tsx`
- `vercel.json` (nuevo)

**Producción:**
- URL: https://qr-survey.vercel.app
- Estado: ✅ Funcional
- Último deploy: Exitoso (14s build time)

---

## 🎯 PLAN PARA MAÑANA

### **Sesión 1: Arreglar Dashboard (30 min)**
1. Modificar `DashboardPage.tsx` para agregar key dinámico
2. Probar localmente
3. Commit y push

### **Sesión 2: Mejorar tooltips (15 min)**
4. Actualizar configuración de Tooltip en SurveyChart
5. Probar con datos reales
6. Commit y push

### **Sesión 3: Testing completo (20 min)**
7. Crear encuesta nueva
8. Agregar preguntas
9. Responder desde móvil
10. Verificar gráficos en Dashboard y SurveyListPage
11. Eliminar encuesta de prueba

---

## 📚 DOCUMENTACIÓN DE CÓDIGO

### **Estructura de componentes:**
```
App.tsx
├── AuthProvider
├── BrowserRouter
│   ├── /login → LoginPage
│   ├── /register → RegisterPage
│   ├── /dashboard → DashboardPage
│   │   └── useSurveys → SurveyChart (PROBLEMA AQUÍ)
│   ├── /surveys → SurveyListPage
│   │   └── SurveyChart (funciona bien)
│   ├── /surveys/new → SurveyCreatePage
│   ├── /surveys/:slug/questions → SurveyQuestionsPage
│   └── /s/:slug → PublicSurveyPage
```

### **Flujo de datos:**
1. Usuario crea encuesta → `SurveyCreatePage`
2. Se guarda en Supabase → tabla `surveys`
3. Redirige a `/surveys/:slug/questions`
4. Agrega preguntas → tabla `questions`
5. Finaliza → navega a `/surveys`
6. Usuario escanea QR → `/s/:slug`
7. Responde → tablas `responses` + `response_answers`
8. Admin ve gráficos → `SurveyChart` consulta datos

---

## 🔐 CONFIGURACIÓN CRÍTICA

### **Supabase RLS Policies creadas:**
- ✅ `surveys` - DELETE (Owners can delete own surveys)
- ✅ `questions` - DELETE (Delete questions when survey deleted)
- ✅ `responses` - DELETE (Delete responses when survey deleted)
- ✅ `response_answers` - DELETE (Delete answers when response deleted)

### **Vercel Settings:**
- ✅ Deployment Protection: Standard (public)
- ✅ Environment Variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- ✅ Domain: qr-survey.vercel.app

---

**FIN DEL ANÁLISIS**
