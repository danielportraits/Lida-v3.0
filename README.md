# LIDA — base PWA modular

Esta entrega es la **primera base funcional y visual** del proyecto: splash con la imagen original, autenticación preparada para Supabase, navegación acordada (Comunidad / Mensajes / Games / Perfil), tour compacto, bienvenida de muestra, juego local de Tres en línea y componentes para continuar las siguientes etapas.

## Requisitos
- Node.js 20 o superior recomendado.
- Proyecto Supabase para autenticación real.

## Ejecutar localmente
```bash
npm install
cp .env.example .env.local
npm run dev
```
Sin credenciales de Supabase se puede abrir la **vista previa** desde la pantalla de acceso. Esta vista previa no representa cuentas reales ni sincroniza datos.

## Configurar Supabase
1. En Supabase, habilita Email/Password y decide si la confirmación de correo es obligatoria.
2. Ejecuta `supabase/schema.sql` desde SQL Editor.
3. Copia URL y anon key al archivo `.env.local` como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Instala Supabase CLI, inicia sesión y vincula el proyecto.
5. Despliega la función de acceso por usuario: `supabase functions deploy login-by-username`.
6. En Auth > URL Configuration, configura las URL locales y la URL final de GitHub Pages.

La función de inicio de sesión por nombre de usuario se ejecuta en servidor y utiliza la service-role key únicamente en secretos de Supabase; **nunca** coloques esa clave en variables `VITE_*` ni en el navegador.

### Nota sobre el esquema
El SQL establece RLS y el aislamiento básico de perfiles, conversaciones y mensajes. Antes de un lanzamiento público hay que revisar el flujo de creación de perfil, los límites de solicitudes, la moderación y las políticas para miembros de grupos y participantes de conversaciones compartidas. No constituye por sí solo una implementación completa de E2EE.

## Publicar en GitHub Pages
- Usa GitHub Actions para instalar dependencias, ejecutar `npm run build` y publicar `dist/`.
- Para un repositorio de proyecto, configura `VITE_BASE_PATH` con la ruta del repositorio, por ejemplo `/lida/`; para un dominio raíz, usa `/`.
- El archivo `_redirects` es para Netlify, no configura por sí solo GitHub Pages. La SPA debe publicarse con rutas compatibles con el hosting elegido.
- Configura los secretos de build para las variables públicas `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Estas son claves públicas de cliente protegidas por RLS; nunca añadas service-role key al frontend.

## Estado de funcionalidades
- **Incluido en esta etapa:** estructura visual responsiva, splash animado, formulario de registro/inicio de sesión, modo vista previa claramente etiquetado, navegación de cuatro módulos, tour compacto, pantallas base y Tres en línea local.
- **Preparado pero requiere configurar/probar:** Supabase Auth, login por username Edge Function, esquema RLS y sesión persistente.
- **Pendiente de fases posteriores:** mensajes persistidos en Supabase y Realtime, contactos reales, grupos con membresías, historias/Reels con carga de medios y cámara WebGL, emparejamiento online, llamadas WebRTC, notificaciones push, cifrado E2EE auditado, almacenamiento y ajustes completos.

No se deben presentar las funciones pendientes como ya operativas.
