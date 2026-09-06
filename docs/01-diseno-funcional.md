# Diseño funcional

**Estado:** aceptado v1.7

**Alcance:** MVP de registro, recurrencias mensuales y visualización de finanzas
cotidianas.

## Visión

Una aplicación personal, privada y rápida para registrar manualmente los ingresos
y gastos del día a día y entenderlos mediante un dashboard. Su pregunta central
es: **¿cuánto ingreso, cuánto gasto y en qué se va mi dinero?**

La prioridad del MVP es reducir al mínimo la fricción de entrada. Se esperan
entre 50 y 100 movimientos al mes y las visualizaciones deben actualizarse con
todo el histórico guardado, no solo con las filas cargadas en pantalla.

## Usuario y evolución prevista

- En el MVP existe un único usuario implícito y una única bolsa de dinero.
- No se modelan cuentas bancarias, efectivo, tarjetas, saldos ni transferencias.
- La arquitectura dejará abierta una futura segunda persona y un espacio común
  para finanzas compartidas de una pareja.
- Inversiones, productos financieros y derivados no forman parte del producto.

## Alcance del MVP

### Movimientos

El usuario puede:

- crear manualmente un ingreso o un gasto;
- consultar movimientos en orden de fecha más reciente;
- editar cualquier movimiento;
- eliminarlo después de una confirmación explícita;
- duplicarlo para registrar rápidamente otro similar;
- buscarlo por texto;
- filtrarlo por un rango exacto de fechas, tipo, categoría o una o varias
  etiquetas;
- recorrer el historial mediante carga progresiva al hacer scroll.

Todos los movimientos están confirmados desde su creación. No existen borradores,
pendientes, conciliados ni estados equivalentes.

El filtro de fechas del historial acepta cualquier día inicial y final, ambos
inclusive. Se puede informar solo “Desde”, solo “Hasta” o ambos. Si existen ambos,
la fecha inicial no puede ser posterior a la final. Este rango diario es
independiente de los periodos mensuales del dashboard.

### Movimientos recurrentes

Un ingreso o gasto existente puede marcarse como recurrente y asignársele un día
del mes. La aplicación crea automáticamente un nuevo movimiento confirmado en
cada vencimiento hasta que se desactive la recurrencia.

- La recurrencia es mensual y admite los días 1 a 31.
- El primer vencimiento es la siguiente fecha futura que coincida con el día
  elegido; marcar un movimiento nunca crea una copia para el mismo día.
- Si un mes no contiene el día indicado —por ejemplo, 31 de febrero— se utiliza
  el último día de ese mes, conservando el día original para meses posteriores.
- Cada copia conserva tipo, importe, categoría, concepto, nota y tags de la
  plantilla vigentes en el momento de generarse.
- Editar un movimiento ya generado no modifica la plantilla ni otros meses.
- Los movimientos generados se distinguen mediante un indicador discreto y se
  comportan como cualquier otro movimiento para edición, eliminación y cálculos.
- Desactivar o eliminar una recurrencia detiene futuras generaciones, pero no
  elimina el movimiento original ni las entradas ya creadas.
- Si el servidor estaba apagado, al volver a ejecutarse crea todos los
  vencimientos omitidos hasta la fecha actual, exactamente una vez por fecha.

La sección Movimientos incluye las pestañas **Todos** y **Recurrentes**. En
Recurrentes se muestran las plantillas activas con tipo, concepto/categoría,
importe, tags, día mensual y próxima fecha. Desde allí se pueden editar o
desactivar después de una confirmación.

### Datos de un movimiento

| Campo | Obligatorio | Regla | Límite aceptado |
| --- | --- | --- | --- |
| Tipo | Sí | `gasto` o `ingreso` | dos valores; no admite otros |
| Importe | Sí | mayor que cero, expresado en EUR | de 0,01 € a 999.999.999,99 € |
| Fecha | Sí | pasada o actual; formato visual `dd/mm/yyyy` | hasta hoy en `Europe/Madrid` |
| Categoría | Sí | compatible con el tipo del movimiento | exactamente una |
| Concepto | No | texto breve para reconocer el movimiento | 200 caracteres |
| Nota | No | contexto adicional de texto libre | 2.000 caracteres |
| Etiquetas | No | colección sin duplicados de cero o más etiquetas | 20 etiquetas por movimiento |

El signo no se introduce manualmente: el tipo determina si el movimiento suma a
ingresos o gastos. Las fechas futuras se reservan para un futuro módulo de
planificación.

Los límites de texto se cuentan en puntos de código Unicode después de
aplicar la normalización descrita más abajo, no sobre el texto tal como se
tecleó.

### Importes aceptados y formato de entrada

El importe se teclea con convención española: la coma separa los decimales y el
punto agrupa los millares. La aplicación convierte el texto a céntimos enteros;
nunca interpreta el valor como número en punto flotante.

Se acepta un importe cuando cumple todas estas condiciones:

- contiene solo dígitos, puntos de millar opcionales y, como mucho, una coma
  decimal con uno o dos decimales;
- si usa puntos de millar, todos los grupos posteriores al primero tienen
  exactamente tres dígitos;
- una vez convertido queda entre 0,01 € y 999.999.999,99 €, ambos inclusive.

Se rechaza cualquier separador ambiguo, un importe cero o negativo, más de dos
decimales, el símbolo de moneda, los espacios internos y el texto libre. El
formulario conserva lo introducido y señala el campo en vez de corregirlo por su
cuenta.

| Entrada | Resultado |
| --- | --- |
| `0,01` | aceptada; 1 céntimo |
| `1234,5` | aceptada; 123.450 céntimos |
| `1.234,56` | aceptada; 123.456 céntimos |
| `999.999.999,99` | aceptada; 99.999.999.999 céntimos, máximo del MVP |
| `1.000.000.000,00` | rechazada; supera el máximo por movimiento |
| `12.50` | rechazada; punto decimal ambiguo |
| `1.23` | rechazada; grupo de millar incompleto |
| `12,345` | rechazada; más de dos decimales |
| `0` y `0,00` | rechazadas; el importe debe ser mayor que cero |
| `-5,00` | rechazada; el signo lo determina el tipo |
| `1 234,56` y `12,5 €` | rechazadas; espacio interno y símbolo de moneda |

Las sumas y medias se calculan sobre céntimos enteros exactos. Antes de exponer
un total la aplicación comprueba que sigue siendo representable sin pérdida de
precisión; si un agregado excediera ese margen devuelve un error controlado y no
una cifra aproximada.

### Normalización de texto

- Nombres de categoría y etiqueta: se recortan los extremos, se normalizan a
  Unicode NFC y las secuencias de espacios internos se reducen a un solo
  espacio. La unicidad se compara en minúsculas sobre ese nombre normalizado,
  conservando las tildes: `Café` y `café` son el mismo nombre, pero `cafe` y
  `café` son nombres distintos. Se conserva la forma escrita por el usuario
  para mostrarla.
- Concepto y nota: se recortan los extremos y se normalizan a Unicode NFC,
  conservando tildes, mayúsculas y espacios internos.
- Se rechazan los caracteres de control no imprimibles en todos estos campos. La
  única excepción son los saltos de línea de la nota, que se guardan como `\n`.
- Un nombre que quede vacío tras normalizar se rechaza como campo obligatorio.

### Duplicar un movimiento

Duplicar abre un formulario precargado con el tipo, importe, categoría,
concepto, nota, etiquetas y la fecha original del movimiento de origen. La copia
no hereda nunca la recurrencia: no se enlaza a ninguna regla ni a un vencimiento
generado, de modo que duplicar una entrada automática produce un movimiento
manual corriente. Nada se guarda hasta confirmar y el movimiento original no se
modifica.

### Categorías iniciales

Las categorías tienen un solo nivel. Sus colores e iconos se asignan
automáticamente y podrán reutilizarse consistentemente en filtros y gráficos.

**Gastos:** alquiler, suministros, supermercado, coche, transporte, formación,
gimnasio, deportes, peluquería, suscripciones, comida a domicilio o para llevar,
tabaco, moda, ropa y equipación deportiva, libros, tecnología, videojuegos,
salud, cuidado personal, casa, regalos, viajes, ocio y otros.

**Ingresos:** sueldo, ventas, regalos y otros.

El usuario puede crear, editar, ordenar y archivar categorías. Una categoría con
movimientos no se elimina: se archiva y sigue apareciendo en el histórico.

- El tipo de una categoría se fija al crearla y no cambia después. Para
  reclasificar gastos como ingresos, o al revés, se crea otra categoría del tipo
  correcto y se editan los movimientos afectados.
- Renombrar respeta la unicidad del nombre normalizado entre las categorías
  activas del mismo tipo y no altera importes ni asociaciones.
- El orden se define solo entre las categorías activas de un mismo tipo; las
  archivadas quedan fuera de la ordenación y conservan su posición anterior.
- El nombre de una categoría admite hasta 80 caracteres.

### Etiquetas

Las etiquetas aportan contexto transversal sin sustituir a la categoría. Ejemplos:
`vacaciones`, `trabajo`, `Madrid`, `Navidad` o `con amigos`.

- Se crean al escribir o se seleccionan entre las existentes.
- Su nombre es único sin distinguir mayúsculas/minúsculas, admite hasta 80
  caracteres y se compara ya normalizado.
- Un movimiento puede tener varias etiquetas, hasta un máximo de 20.
- Los filtros con varias etiquetas usan semántica **OR**: aparece un movimiento
  si contiene cualquiera de las seleccionadas.
- Una etiqueta puede renombrarse y archivarse sin modificar el histórico.
- Una etiqueta archivada que ya estaba en un movimiento puede conservarse al
  editarlo; si se quita, no vuelve a poder añadirse.
- El dashboard atribuye el importe completo a cada etiqueta: un gasto de 60 € con
  dos tags contabiliza 60 € en cada uno. Por ello, la suma de una gráfica por
  etiquetas puede superar el gasto total. La interfaz debe explicar el solape y
  no presentar esa vista como partición del total.

### Dashboard

El periodo inicial es el mes actual. Se puede seleccionar mes anterior, últimos
3 meses completos, año actual o un rango personalizado de meses completos. El
mes es la unidad temporal más pequeña para agrupaciones y comparaciones.

La evolución mensual utiliza una ventana propia: mes actual más los 11 meses
anteriores o, si existe menos histórico, desde el mes del primer movimiento. No
cambia al seleccionar otro periodo para las tarjetas.

Las comparaciones evitan enfrentar periodos parciales con periodos completos:

- mes actual hasta hoy frente a los mismos días del mes anterior;
- mes anterior completo frente al mes completo precedente;
- últimos 3 meses completos frente a los 3 meses completos anteriores;
- año actual hasta hoy frente al mismo intervalo del año anterior;
- rango personalizado de meses completos frente al bloque inmediatamente
  anterior con el mismo número de meses.

La composición es fija e incluye:

1. Tarjetas de ingresos, gastos y balance neto del periodo.
2. Evolución mensual de ingresos y gastos durante hasta 12 meses, incluido el
   actual.
3. Distribución de gastos por categoría, principalmente en barras.
4. Comparación visual de ingresos frente a gastos.
5. Distribución de gastos por etiquetas.
6. Lista de movimientos recientes.
7. Comparación con el periodo anterior equivalente.
8. Media mensual de gasto total de los últimos 12 meses completos.
9. Media mensual de gasto por categoría y por etiqueta.
10. Balance neto medio mensual.

El dashboard incluye un selector multiselección para categorías y otro para tags.
Cada uno controla todos los desgloses de su dimensión —distribución del periodo y
media mensual—. Inicialmente están seleccionados todos los elementos activos. El
usuario puede buscar, activar varios, **Seleccionar todas** o **Quitar todas**.
La selección solo decide qué series o barras aparecen: no altera ingresos,
gastos, balance, medias globales ni el filtro del historial. Los elementos sin
datos en la ventana correspondiente no dibujan una barra. Con cero elementos
seleccionados se muestra un estado vacío y el acceso “Seleccionar todas”.

No se muestra saldo. El balance neto es únicamente `ingresos − gastos` dentro del
periodo seleccionado.

Cada cifra, categoría o etiqueta activable abre el listado con los filtros que
explican su composición. Los gráficos ofrecen una tabla o listado equivalente.

### Ventana de medias mensuales

Las medias emplean una ventana independiente del periodo seleccionado en el
dashboard para ofrecer una referencia estable:

- comprende como máximo los 12 meses naturales completos anteriores al actual;
- si existe menos histórico, comienza en el primer mes natural completo posterior
  al primer movimiento y termina en el último mes completo;
- incluye en el divisor los meses sin movimientos dentro de la ventana;
- nunca incluye el mes actual, porque todavía está incompleto;
- si no ha finalizado ningún mes desde el primer movimiento, muestra “Sin
  histórico suficiente” en lugar de cero.

La media de gasto total es `gastos de la ventana ÷ meses incluidos`. La media por
categoría aplica la misma división a cada categoría. La media por etiqueta
atribuye el importe completo a cada tag, por lo que sus grupos pueden solaparse.
El balance neto medio es `(ingresos − gastos) de la ventana ÷ meses incluidos`.
Cada visualización indica explícitamente la ventana utilizada.

### Datos de demostración

La aplicación incluye un conjunto de datos mock, claramente identificable y
reemplazable, que permite explorar todos los componentes del dashboard. Los datos
de demostración no deben mezclarse accidentalmente con datos personales.

## Historias y criterios de aceptación

| ID | Historia | Criterio principal de aceptación |
| --- | --- | --- |
| F-01 | Registrar un gasto rápidamente | Con los cuatro campos obligatorios, dentro de los límites aceptados, se guarda y actualiza el dashboard |
| F-02 | Registrar un ingreso | Se refleja en ingresos y balance del periodo correspondiente |
| F-03 | Corregir un movimiento | La edición aplica las reglas del alta, permite conservar la clasificación archivada previa y recalcula todas las métricas afectadas |
| F-04 | Eliminar un movimiento | Se pide confirmación y desaparece de historial y estadísticas |
| F-05 | Duplicar un movimiento | Se abre una copia editable con la fecha original y sin recurrencia, que no se guarda hasta confirmar |
| F-06 | Encontrar movimientos | Búsqueda y filtros, incluido un rango diario exacto, producen un listado coherente y combinable |
| F-07 | Entender el periodo | Dashboard muestra ingresos, gastos, neto y comparativa correctos |
| F-08 | Analizar categorías | Una categoría abre exactamente los gastos que componen su cifra |
| F-09 | Analizar contexto | Puedo asignar varios tags y filtrar/agrupar gastos por ellos |
| F-10 | Consultar mucho histórico | El scroll carga más filas sin alterar totales ni filtros |
| F-11 | Programar un movimiento mensual | Al marcarlo, se muestra en Recurrentes con su próxima fecha |
| F-12 | Generar un vencimiento | En el día mensual se crea una sola copia confirmada y actualiza el dashboard |
| F-13 | Detener una recurrencia | No se crean más copias y se conservan los movimientos anteriores |
| F-14 | Conocer mis medias mensuales | Veo gasto total, gasto por categoría/tag y balance neto sobre una ventana explícita |
| F-15 | Reducir el ruido de los desgloses | Selecciono varias categorías/tags, todas o ninguna, sin alterar los totales |

## Reglas de negocio

1. Los importes se almacenan como céntimos enteros positivos; nunca como `float`.
2. Todos los importes están denominados en EUR.
3. Un movimiento pertenece a una única categoría compatible con su tipo.
4. Las etiquetas de un movimiento forman un conjunto, no una lista con repetidos.
5. El balance de un periodo es la suma de ingresos menos la suma de gastos.
6. Los límites de un periodo se interpretan en `Europe/Madrid` y la fecha del
   movimiento es una fecha local sin hora.
7. Scroll y paginación afectan solo a la presentación del historial; las
   agregaciones siempre consideran todos los movimientos del filtro.
8. Editar, eliminar o crear actualiza las visualizaciones afectadas sin requerir
   una recarga manual.
9. Archivar una categoría o etiqueta impide asignarla a nuevos movimientos pero
   conserva y permite consultar sus asociaciones históricas.
10. Solo puede existir una copia generada por combinación de recurrencia y fecha
    de vencimiento, aunque el proceso automático se reintente.
11. Una recurrencia desactivada no genera vencimientos posteriores a su fecha de
    desactivación.
12. Los movimientos recurrentes participan en estadísticas únicamente cuando la
    entrada real ha sido creada; no existen importes previstos en el dashboard.
13. Las medias mensuales excluyen el mes actual e incluyen meses a cero dentro de
    su ventana para evitar resultados sesgados al alza.
14. La selección visible de categorías y tags es un control de presentación
    local; los cálculos globales siempre consideran todo el conjunto aplicable.
15. Los límites “Desde” y “Hasta” del historial incluyen todos los movimientos de
    esas fechas en `Europe/Madrid`; no modifican el periodo activo del dashboard.
16. Una comparación nunca enfrenta el mes actual parcial con un mes anterior
    completo; utiliza intervalos equivalentes.
17. Un movimiento admite entre 1 céntimo y 99.999.999.999 céntimos
    (999.999.999,99 €). El texto del importe sigue la convención española y se
    rechaza cualquier separador ambiguo.
18. Las agregaciones suman céntimos enteros exactos y comprueban el
    desbordamiento antes de publicar un total; un agregado no representable
    devuelve un error controlado en lugar de una cifra redondeada.
19. Concepto admite 200 caracteres, la nota 2.000, los nombres de categoría y
    etiqueta 80, y un movimiento admite como máximo 20 etiquetas.
20. Los nombres de categoría y etiqueta se guardan recortados, en Unicode NFC y
    con los espacios internos colapsados; su unicidad se compara en minúsculas
    conservando las tildes. Los campos de texto rechazan controles no
    imprimibles, salvo los saltos de línea de la nota.
21. El tipo de una categoría es inmutable; un cambio de tipo del movimiento
    exige elegir una categoría activa compatible con el nuevo tipo.
22. Al editar un movimiento se puede conservar la categoría o las etiquetas
    archivadas que ya tenía, pero no asignarle otras archivadas distintas.
23. Duplicar copia los valores y la fecha del movimiento de origen y nunca su
    regla de recurrencia ni su vencimiento generado.

## Fuera del MVP

- Cuentas, saldos iniciales, patrimonio y transferencias.
- Importación/exportación de datos y carga mediante CSV.
- Sincronización bancaria.
- Presupuestos, objetivos, recurrencias no mensuales y movimientos futuros como
  previsiones.
- Múltiples monedas.
- Inversiones, préstamos, tarjetas y derivados.
- Segundo usuario, pareja, gastos compartidos y permisos.
- Autenticación; el despliegue MVP debe permanecer en una red privada.
- Personalización del dashboard o de iconos y colores.
- Aplicaciones móviles nativas y funcionamiento offline.

## Indicadores de éxito

- Crear un movimiento habitual en menos de 15 segundos desde móvil.
- El dashboard refleja correctamente cualquier alta, edición o eliminación.
- Toda cifra visible puede explicarse mediante el historial filtrado.
- La interfaz mantiene una interacción fluida con al menos 100 000 movimientos,
  aunque el volumen esperado sea mucho menor.
- Registrar datos manualmente resulta viable de forma sostenida durante un mes.

## Validaciones posteriores mediante prototipo

El alcance funcional está cerrado. Mediante el prototipo se validarán:

- orden y jerarquía exactos de los módulos del dashboard;
- flujo más rápido de alta en móvil;
- vocabulario y convenciones visuales concretas inspiradas en Revolut;
- ejemplos finales de datos mock;
- si la gráfica por etiquetas muestra gasto sin etiquetar como grupo explícito.
