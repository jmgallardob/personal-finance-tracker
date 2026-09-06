# ADR 0002 — Límites monetarios, normalización de texto y clasificación del MVP

- **Estado:** aceptado
- **Fecha:** 2026-09-06
- **Responsables:** propietario del producto
- **Sustituye a:** no aplica
- **Sustituido por:** no aplica

## Contexto

El diseño funcional describía importes «mayores que cero» y textos «breves» sin
fijar límites, y no decía cómo comparar nombres con tildes o mayúsculas, qué
ocurre al editar un movimiento cuya categoría o etiqueta se archivó después, si
una categoría puede cambiar de tipo, ni qué copia exactamente la duplicación.
Cada ambigüedad admitía interpretaciones incompatibles entre dominio, API y UI,
y todas ellas bloqueaban el trabajo de dominio, persistencia y formularios.

## Opciones consideradas

### Dejar los límites al criterio de cada capa

Permite empezar antes, pero produce validaciones distintas en formulario, API y
base de datos, y hace que un mismo texto se acepte o se rechace según el camino.
También impide escribir tests de borde estables.

### Fijar límites explícitos y una normalización única en el dominio

Obliga a decidir ahora valores concretos y a documentarlos, pero da una sola
fuente de verdad para dominio, contrato HTTP, esquema SQLite y pruebas, y hace
que los casos límite sean comprobables.

### Normalizar nombres eliminando diacríticos

Simplifica la comparación, pero fusionaría `cafe` y `café` como el mismo nombre
y haría imposible mantener dos etiquetas legítimamente distintas en español.

## Decisión

Se adopta la segunda opción con estas reglas finales:

1. Un movimiento acepta de 0,01 € a 999.999.999,99 €, es decir de 1 a
   99.999.999.999 céntimos enteros.
2. El importe se teclea en convención española; se rechazan separadores
   ambiguos, más de dos decimales, signo, símbolo de moneda y espacios internos.
3. Las agregaciones suman céntimos enteros exactos y comprueban el
   desbordamiento antes de exponer un total; si no es representable devuelven
   un error controlado.
4. Longitudes máximas: concepto 200, nota 2.000, nombre de categoría o etiqueta
   80, y 20 etiquetas por movimiento.
5. Los nombres se recortan, se normalizan a Unicode NFC, colapsan sus espacios
   internos y se comparan en minúsculas conservando las tildes.
6. Concepto y nota conservan las tildes; se rechazan los controles no
   imprimibles salvo los saltos de línea de la nota.
7. El tipo de una categoría es inmutable; cambiar el tipo de un movimiento exige
   una categoría activa compatible.
8. Al editar se puede conservar la categoría o las etiquetas archivadas que el
   movimiento ya tenía, pero no asignarle otras archivadas.
9. La reordenación solo admite categorías activas de un mismo tipo.
10. Duplicar copia valores y fecha de origen, nunca la regla de recurrencia ni
    el vencimiento generado.

### Ejemplos aceptados

| Caso | Entrada | Resultado |
| --- | --- | --- |
| Importe mínimo | `0,01` | 1 céntimo |
| Decimal simple | `1234,5` | 123.450 céntimos |
| Millares | `1.234,56` | 123.456 céntimos |
| Importe máximo | `999.999.999,99` | 99.999.999.999 céntimos |
| Fuera de rango | `1.000.000.000,00` | rechazado |
| Punto decimal ambiguo | `12.50` | rechazado |
| Grupo de millar incompleto | `1.23` | rechazado |
| Tres decimales | `12,345` | rechazado |
| Importe nulo o negativo | `0`, `0,00`, `-5,00` | rechazados |
| Ruido de formato | `1 234,56`, `12,5 €` | rechazados |
| Nombre equivalente | `  Café  ` frente a `café` | mismo nombre; duplicado |
| Nombre distinto | `cafe` frente a `café` | nombres distintos |
| Espacios internos | `ropa   deporte` | se guarda `ropa deporte` |
| Editar con archivada previa | mantener la categoría archivada del movimiento | aceptado |
| Editar con otra archivada | asignar una categoría archivada distinta | rechazado |
| Cambio de tipo | gasto a ingreso conservando categoría de gasto | rechazado; exige categoría de ingreso activa |
| Duplicar generado | copia de un vencimiento recurrente | movimiento manual con la fecha original y sin regla |

## Consecuencias

- Dominio, contrato HTTP, esquema y pruebas comparten los mismos límites, y los
  casos de borde se pueden probar sin reinterpretarlos.
- La comparación de nombres exige guardar el nombre normalizado junto al de
  presentación y un índice único sobre el primero.
- Conservar tildes implica que el usuario puede crear pares parecidos como
  `cafe` y `café`; se acepta ese coste frente a fusionar nombres legítimos.
- El límite por movimiento no es la única salvaguarda: los agregados necesitan
  su propia comprobación de desbordamiento.
- Si en el futuro se admitieran varias monedas o importes mayores, esta decisión
  debería sustituirse por otra ADR.

## Evidencia

Reglas trasladadas al [diseño funcional](../01-diseno-funcional.md) —campos,
importes aceptados, normalización, duplicación, categorías, etiquetas y reglas
de negocio 17 a 23— y al [diseño técnico](../02-diseno-tecnico.md)
—invariantes, contrato de validación y mutaciones críticas—. El propietario del
producto aprobó estas reglas el 2026-09-06.
