# Diseño técnico

**Estado:** aceptado v1.5 para el MVP

**Enfoque:** monolito modular privado, desplegable como una única aplicación.

## Objetivos

- Optimizar la entrada manual desde móvil.
- Mantener exactitud monetaria y estadísticas trazables.
- Operar con poco mantenimiento en un servidor privado.
- Soportar el crecimiento del histórico sin cargarlo completo en el navegador.
- Facilitar una evolución futura hacia finanzas compartidas sin implementar aún
  usuarios, permisos ni cuentas conjuntas.

## Contexto de ejecución

```text
Móvil u ordenador
       │ red privada / VPN
       ▼
Aplicación web (UI + casos de uso)
       │
       └── SQLite en disco local
```

El MVP no incorpora autenticación. Por tanto, el servicio solo puede escuchar en
una red privada de confianza o publicarse detrás de una VPN con control de acceso.
Exponerlo directamente a internet requiere añadir autenticación antes del
despliegue y queda fuera del alcance acordado.

## Módulos

| Módulo | Responsabilidad |
| --- | --- |
| Movimientos | altas, edición, eliminación, duplicado, listado y búsqueda |
| Clasificación | categorías, etiquetas y sus asociaciones |
| Analítica | agregaciones por periodo, tipo, categoría y etiqueta |
| Recurrencias | plantillas mensuales, generación idempotente y desactivación |
| Preferencias | locale, moneda, zona horaria y datos de demostración |

La UI accede a casos de uso, no directamente a tablas. No se introducen colas,
cachés distribuidas, workers ni servicios separados.

## Modelo de datos

### Preparación para un futuro espacio compartido

Aunque exista una sola persona, las entidades financieras incluirán
`workspace_id`. En el MVP se crea un único espacio implícito. En una evolución,
`WorkspaceMember` podrá relacionar dos personas con ese espacio sin reasignar
todos los movimientos ni mezclar propiedad personal con autenticación.

Esto no implica construir UI multiusuario ni permisos durante el MVP.

### Entidades

- `Workspace`: contenedor de los datos financieros; uno implícito en el MVP.
- `Preference`: español, locale, EUR y zona horaria `Europe/Madrid`.
- `Transaction`: tipo, céntimos, fecha, categoría, concepto, nota y timestamps.
- `Category`: nombre, tipo, icono/color automáticos, orden y fecha de archivado.
- `Tag`: nombre normalizado, presentación y fecha de archivado.
- `TransactionTag`: relación muchos-a-muchos entre movimiento y etiqueta.
- `RecurringRule`: plantilla mensual, día objetivo, próxima fecha, estado y fecha
  de desactivación.

No existen tablas `Account`, `Balance`, `Transfer`, `Budget` ni `ImportBatch` en
el esquema inicial.

### Invariantes

- `amount_minor INTEGER > 0` —entero de 64 bits de SQLite— y moneda fija
  `EUR`.
- `type` solo admite `income` o `expense`.
- La categoría pertenece al mismo workspace y coincide con el tipo.
- Un movimiento no puede repetir una etiqueta.
- Fecha efectiva como texto ISO `YYYY-MM-DD`; marcas técnicas como enteros Unix
  en milisegundos UTC.
- Los nombres normalizados de categorías y tags activos son únicos dentro de su
  ámbito y workspace.
- El archivado conserva asociaciones históricas.
- Cada mutación y sus asociaciones se confirman en una transacción SQL.
- Cada movimiento automático guarda `recurring_rule_id` y `scheduled_for`; una
  restricción única sobre ambos campos impide duplicar un vencimiento.

## Capas

```text
Presentación → Aplicación → Dominio
       │            │          ▲
       └──── Infraestructura ───┘
```

- **Presentación:** rutas, componentes, formularios y parámetros de URL.
- **Aplicación:** casos de uso, transacciones SQL e invalidación de datos.
- **Dominio:** reglas puras de dinero, periodos, filtros y agregación.
- **Infraestructura:** repositorios SQL, reloj, configuración y logs.

## Consultas

### Historial

- Paginación por cursor estable usando `(date, created_at, id)` descendente.
- Tamaño inicial propuesto: 30 movimientos por página.
- El cursor y los filtros se procesan en servidor.
- La búsqueda cubre concepto y nota, con escape y normalización apropiados.
- Los filtros combinan `dateFrom`, `dateTo`, tipo, categoría, texto y tags.
- Al seleccionar varios tags se aplica semántica OR.

`dateFrom` y `dateTo` son fechas ISO sin hora en el contrato, se aplican de
forma inclusiva y son opcionales independientemente. Se validan en el servidor y
se serializan en la URL del historial. No se convierten en el selector mensual
del dashboard ni heredan sus presets salvo al navegar expresamente desde una
métrica.

La carga progresiva solicita páginas sucesivas. Nunca se usa el subconjunto
cargado en cliente para calcular un total global.

### Dashboard

Una consulta de resumen recibe el filtro temporal y devuelve:

- suma de ingresos, gastos y balance;
- agregación mensual de ingreso/gasto;
- gastos por categoría;
- gastos por etiqueta y gasto sin etiquetas;
- comparación con el periodo anterior equivalente;
- medias mensuales de gasto total, gasto por categoría/tag y balance neto sobre
  la ventana móvil de meses completos;
- movimientos recientes.

Las asociaciones muchos-a-muchos de tags deben agregarse por separado para no
multiplicar accidentalmente ingresos/gastos generales. En la agregación por tag,
el importe completo se atribuye a cada tag asociado. La API indicará que los
grupos se solapan y que su suma no representa el gasto total.

La consulta de medias determina en `Europe/Madrid` el último mes natural cerrado
y toma hasta 12 meses, comenzando como pronto en el primer mes natural completo
posterior al primer movimiento. Genera explícitamente la serie de meses para
incluir meses sin datos con valor cero. Si la ventana está vacía devuelve
`insufficientHistory`, no importes cero. La respuesta incluye `windowStart`,
`windowEnd` y `monthCount` para que la UI pueda explicar el cálculo.

La serie de evolución es independiente del selector principal y comprende el mes
actual más hasta 11 meses anteriores. Para el mes actual, la comparación usa los
mismos días del mes anterior; los demás presets emplean los periodos completos o
intervalos equivalentes definidos funcionalmente.

Las selecciones de categorías y tags se aplican sobre las series de desglose ya
devueltas o mediante parámetros específicos de visualización. Un estado por
dimensión se comparte entre su distribución del periodo y su media mensual. No se
reutiliza como filtro de la consulta de totales. Esta separación evita que una
selección parcial cambie accidentalmente ingresos, gastos, balance o medias
globales. El estado se conserva durante la sesión y no requiere persistencia en
base de datos en el MVP.

## Mutaciones críticas

### Crear o editar

1. Validar estructura, importe, fecha, tipo, categoría y tags.
2. Comprobar pertenencia al workspace implícito.
3. Guardar movimiento y relaciones en una transacción SQL.
4. Invalidar resumen y páginas del historial afectadas.
5. Devolver la representación normalizada.

### Duplicar

Duplicar no persiste inmediatamente. Devuelve o abre un formulario precargado,
con identificador nuevo solo después de que el usuario confirme.

### Eliminar

Tras confirmación en UI, el caso de uso borra movimiento y relaciones de forma
atómica. El MVP no promete recuperación posterior; la confirmación debe nombrar
claramente la transacción afectada.

### Generar recurrencias

1. Una tarea programada obtiene reglas activas con `next_due_date <= hoy`, usando
   la fecha actual de `Europe/Madrid`.
2. Por cada vencimiento pendiente abre una transacción SQL y crea el movimiento
   con una copia de la plantilla y de sus tags.
3. La restricción `(recurring_rule_id, scheduled_for)` hace idempotente cualquier
   reintento o ejecución concurrente.
4. Calcula el próximo mes utilizando el día objetivo o su último día disponible.
5. Repite hasta que `next_due_date` sea futura para recuperar meses omitidos.

La tarea se ejecuta al menos diariamente y también al arrancar la aplicación. El
dashboard solo consulta movimientos materializados; una regla nunca cuenta como
gasto o ingreso previsto.

## Seguridad y privacidad

- Escuchar en interfaz privada por defecto y documentar configuración con VPN.
- HTTPS incluso en red privada cuando el proxy utilizado lo permita.
- Protección CSRF/origin en mutaciones y cabeceras de seguridad.
- Validación de entrada y consultas parametrizadas.
- Sin conceptos, notas, importes ni tags personales en logs.
- Secretos y URL de base de datos fuera del repositorio.
- Datos mock totalmente ficticios y separados del dataset personal.

## Resiliencia

- SQLite usa WAL, claves foráneas activadas en cada conexión y un `busy_timeout`
  para absorber la breve concurrencia entre peticiones y la tarea de recurrencias.
- El archivo de base de datos reside en disco local persistente, nunca en un
  sistema de archivos de red.
- Backup cifrado automático mediante la API de backup de SQLite o
  `VACUUM INTO`; no se copia en caliente el archivo principal de forma directa.
- Retención inicial: 7 copias diarias, 4 semanales y 12 mensuales.
- Restauración probada en entorno desechable antes de considerar publicable una
  versión que cambie el esquema.
- Migraciones versionadas y hacia delante; backup previo a cambios destructivos.
- La exportación para el usuario se incorporará en una evolución posterior.

## Rendimiento

- Objetivo p95 en red privada: lecturas comunes < 500 ms y mutaciones < 800 ms.
- Índices iniciales: workspace+fecha, workspace+tipo+fecha, categoría+fecha,
  tag+movimiento y nombre normalizado.
- Dataset de validación: 100 000 movimientos con distribución realista.
- El dashboard se agrega en SQLite; no se descarga todo el histórico.
- Cualquier caché futura será derivada, invalidable y reconstruible.

## Decisiones pospuestas

- Identidades, sesiones y miembros de un workspace.
- Separación de movimientos personales y conjuntos.
- Cuentas financieras, saldos y transferencias.
- Importación, sincronización bancaria y exportación.
- Adjuntos, recurrencias distintas de la mensual, presupuestos y múltiples
  monedas.
