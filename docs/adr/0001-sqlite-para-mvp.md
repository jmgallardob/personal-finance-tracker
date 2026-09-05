# ADR 0001 — SQLite para el MVP

- **Estado:** aceptado
- **Fecha:** 2026-09-05
- **Responsables:** propietario del producto
- **Sustituye a:** propuesta inicial de PostgreSQL
- **Sustituido por:** no aplica

## Contexto

El MVP tiene un usuario, una instancia de aplicación en un VPS privado, entre 50
y 100 movimientos mensuales y escrituras breves. El backend centraliza el acceso
desde móvil y escritorio. Las necesidades transaccionales son movimientos, tags,
categorías, estadísticas y una tarea diaria de recurrencias.

## Opciones consideradas

### SQLite

Base embebida, transaccional y almacenada en un archivo local. El modo WAL
permite lectores concurrentes con un escritor y elimina un servicio adicional
del despliegue.

### libSQL

Compatible con el modelo SQLite y útil para acceso remoto o réplicas embebidas,
capacidades que el MVP no necesita porque todo acceso pasa por un único backend.

### PostgreSQL

Ofrece mayor concurrencia de escritura y operación multiinstancia, pero requiere
un servicio, credenciales, red, mantenimiento y backups específicos adicionales.

## Decisión

Usar SQLite en modo WAL sobre disco local persistente. Se activan claves foráneas
en cada conexión, transacciones breves, restricciones únicas, índices explícitos
y espera acotada ante un escritor ocupado. La aplicación se despliega como una
única instancia.

Los backups se generan mediante la API de backup de SQLite o `VACUUM INTO` y se
cifran fuera del archivo de trabajo.

## Consecuencias

- El entorno local, CI y producción usan el mismo motor.
- El despliegue necesita solo la aplicación y un volumen persistente.
- La tarea de recurrencias debe tolerar la serialización de escrituras y seguir
  siendo idempotente.
- El archivo no puede alojarse en un sistema de archivos de red.
- libSQL se reconsiderará ante necesidades de replicación o base remota.
- PostgreSQL se reconsiderará ante varias instancias, concurrencia sostenida de
  escritores, crecimiento multiusuario o integraciones intensivas.
- Una migración de motor será explícita y probada; no se promete portabilidad
  automática.

## Evidencia

- Volumen previsto muy inferior a la capacidad práctica de SQLite.
- Un solo backend y baja concurrencia de escritura.
- WAL, restricciones y transacciones cubren las invariantes actuales.
- Eliminar el servicio PostgreSQL reduce operación y superficie de fallo.
