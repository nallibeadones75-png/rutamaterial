# RutaMaterial

Del proyecto a los materiales, sin rodeos. App web que convierte la idea de un proyecto en una lista de materiales cotizada en tiendas reales de Santiago, con plan de compra y ruta en Google Maps.

Proyecto final del curso *Crea tu Agente IA: Automatiza tu día a día* (UDD) · Nallibe Abril Adones Nara · noviembre 2026.

## Estructura

- `index.html`: la app completa (HTML, CSS y JavaScript).
- `netlify/functions/ai.mjs`: función del servidor que conecta la app con la IA (Claude, de Anthropic). La clave de la API se guarda en Netlify, nunca en este repositorio.
- `netlify.toml`: configuración del sitio.

## Publicar en Netlify

1. Sube estos archivos a un repositorio de GitHub.
2. En Netlify elige **Add new site → Import an existing project → GitHub** y escoge el repositorio. No hace falta comando de build.
3. En **Site configuration → Environment variables**, agrega `ANTHROPIC_API_KEY` con tu clave de console.anthropic.com.
4. Vuelve a publicar con **Deploys → Trigger deploy**.

Sin la clave, la app funciona igual (ejemplo, catálogo, plan, mapa), pero las funciones de IA muestran un aviso.

## Privacidad

La app no tiene cuentas ni base de datos: proyectos, chat y ajustes quedan en el navegador de cada persona. El texto que se escribe para la IA se envía a Anthropic a través de la función del servidor.
