# Registro de decisiones de arquitectura

Un ADR conserva el contexto y las consecuencias de una decisión costosa de
revertir. Se numera de forma correlativa (`0001-titulo.md`) y no se reescribe una
vez aceptado; una nueva decisión puede sustituirlo.

## Flujo

1. Copiar `0000-plantilla.md` con el siguiente número.
2. Describir contexto, opciones y consecuencias, no solo la elección.
3. Abrirlo como `propuesto`; cambiar a `aceptado` al aprobarlo.
4. Si cambia la decisión, crear otro ADR y enlazarlos como `sustituido por` y
   `sustituye a`.

## Decisiones iniciales previstas

- [ADR 0001 — SQLite para el MVP](0001-sqlite-para-mvp.md) — aceptado.
- [ADR 0002 — Límites, normalización y clasificación](0002-limites-normalizacion-y-clasificacion.md)
  — aceptado.
- [ADR 0003 — Ventanas, medias y desgloses](0003-ventanas-medias-y-desgloses.md)
  — aceptado.
- Workspace implícito como límite para futura información compartida.
- Topología de despliegue privado sin autenticación y acceso mediante VPN.
- Semántica y presentación de agregaciones con múltiples tags.
