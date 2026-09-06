# ADR 0003 — Ventanas de comparación, medias y desgloses del dashboard

- **Estado:** aceptado
- **Fecha:** 2026-09-06
- **Responsables:** propietario del producto
- **Sustituye a:** no aplica
- **Sustituido por:** no aplica

## Contexto

El diseño funcional exigía comparar “intervalos equivalentes” sin decir qué
ocurre cuando el mes anterior no tiene el día en curso, ni qué mostrar cuando el
valor previo es cero. Tampoco fijaba dónde se redondea una media, si la
evolución dibuja los meses vacíos, cómo se representa el gasto sin etiquetas ni
qué pasa con una clasificación archivada que sí tiene importe en la ventana.
Cada hueco admitía lecturas incompatibles entre analítica, API y dashboard, y
todas bloqueaban el trabajo de métricas y de la interfaz.

## Opciones consideradas

### Comparar meses completos y ocultar los casos incómodos

Evita el problema del día 31 comparando siempre meses naturales completos, pero
enfrenta un mes en curso con uno cerrado y contradice la regla de negocio que
prohíbe justamente esa comparación.

### Recortar el intervalo actual al día máximo común

Comparar 1–28 de marzo con 1–28 de febrero iguala la duración, pero esconde
gasto real del periodo activo: la cifra comparada dejaría de coincidir con la
tarjeta del periodo.

### Limitar solo el extremo anterior y separar cálculo de presentación

Mantiene íntegro el periodo actual, acota el anterior a su último día disponible
y rotula ambos intervalos. Junto a ello, las medias viajan como suma exacta y
divisor y solo se redondean al pintarse. Exige documentar los casos límite, pero
deja una única lectura para dominio, API y UI.

## Decisión

Se adopta la tercera opción con estas reglas finales:

1. Una comparación llega hasta el mismo día ordinal en ambos intervalos; cuando
   el intervalo anterior no contiene ese día, su extremo se limita al último día
   de su mes y el actual no se recorta.
2. Los dos intervalos realmente comparados se rotulan en la interfaz.
3. El cambio porcentual es `(actual − anterior) ÷ abs(anterior)`. Con anterior
   cero y actual distinto de cero no hay porcentaje y se muestra “Sin base de
   comparación”; con ambos a cero el cambio es 0 %.
4. Las medias conservan su suma exacta en céntimos y su divisor de meses.
5. El redondeo al céntimo más próximo, con la mitad alejándose de cero también
   en negativos, es solo de presentación; nunca se suman medias ya redondeadas.
6. La evolución mensual materializa a cero los meses sin movimientos de su
   ventana y muestra un estado vacío cuando no existe ningún movimiento.
7. “Sin etiquetas” es un grupo calculado de gasto sin etiquetar, visible
   siempre que la ventana contenga ese gasto y seleccionable en el selector de
   etiquetas, sin ninguna fila artificial en la tabla de etiquetas.
8. Su detalle abre el historial con un filtro de gasto sin etiquetar, mutuamente
   excluyente con el filtro por etiqueta.
9. Las clasificaciones archivadas con importe en la ventana aparecen marcadas en
   su selector y sin seleccionar por defecto; sus importes siguen contando en
   totales y medias globales.
10. Un elemento activo nuevo entra en la selección mientras el usuario no haya
    interactuado manualmente con ese selector; después se conserva su elección
    durante la sesión.

### Ejemplos aceptados

Extremos de comparación:

| Periodo activo | Intervalo actual | Intervalo comparado |
| --- | --- | --- |
| Mes actual a 31 de marzo, año no bisiesto | 1–31 de marzo | 1–28 de febrero |
| Mes actual a 31 de marzo, año bisiesto | 1–31 de marzo | 1–29 de febrero |
| Mes actual a 31 de mayo | 1–31 de mayo | 1–30 de abril |
| Mes actual a 15 de marzo | 1–15 de marzo | 1–15 de febrero |
| Año actual a 29 de febrero, año bisiesto | 1 de enero–29 de febrero | 1 de enero–28 de febrero del año anterior |
| Mes anterior completo, marzo | 1–31 de marzo | 1–28 o 1–29 de febrero |

Cambio porcentual:

| Anterior | Actual | Resultado |
| --- | --- | --- |
| 400,00 € | 500,00 € | +25,00 % |
| 200,00 € | 150,00 € | −25,00 % |
| −100,00 € | −50,00 € | +50,00 % |
| 0,00 € | 250,00 € | sin porcentaje; “Sin base de comparación” |
| 0,00 € | 0,00 € | 0,00 % |

Medias y redondeo:

| Caso | Suma exacta | Media exacta | Media mostrada |
| --- | --- | --- | --- |
| 3 meses, gasto total | 1.000,00 € | 333,333… € | 333,33 € |
| 2 meses, gasto total | 1.000,01 € | 500,005 € | 500,01 € |
| 2 meses, balance neto negativo | −1.000,01 € | −500,005 € | −500,01 € |
| 2 meses, categoría `casa` | 100,01 € | 50,005 € | 50,01 € |
| 2 meses, categoría `ocio` | 100,01 € | 50,005 € | 50,01 € |
| 2 meses, ambas categorías | 200,02 € | 100,01 € | 100,01 € |

Las dos medias por categoría mostradas suman 100,02 €, pero la media total
mostrada es 100,01 € porque procede de la suma exacta.

Etiquetas solapadas y clasificación archivada:

| Caso | Resultado |
| --- | --- |
| Gasto de 60 € con `viajes` y `con amigos` | 60 € a cada grupo y 60 € al gasto total |
| Ese gasto en una ventana de 2 meses | media de 30 € por etiqueta y 30 € de media total |
| Ventana con gasto sin etiquetar | aparece el grupo “Sin etiquetas”, seleccionable |
| Detalle de ese grupo | historial de gasto sin etiquetar, incompatible con filtrar por etiqueta |
| Categoría `gimnasio` archivada en marzo con 120 € en febrero | los 120 € siguen en el total y en la media; su barra solo aparece si se selecciona |
| Etiqueta activa creada tras abrir el dashboard | entra en la selección salvo que el usuario ya haya tocado ese selector |

## Consecuencias

- Analítica, API y dashboard comparten los mismos extremos, el mismo redondeo y
  el mismo tratamiento de archivados, y los casos límite son comprobables.
- La respuesta de resumen debe transportar los cuatro extremos comparados, y las
  medias su suma y su divisor, en lugar de cifras ya presentadas.
- Un porcentaje puede llegar vacío: la interfaz necesita un texto explicativo en
  lugar de dibujar un 0 % engañoso.
- Sumar lo que se ve deja de ser válido; cualquier total se recalcula desde las
  sumas exactas.
- El grupo sin etiquetas obliga a un filtro propio del historial y a validar su
  exclusión mutua con el filtro por etiqueta.
- Si en el futuro se admitieran periodos no mensuales o varias monedas, esta
  decisión debería sustituirse por otra ADR.

## Evidencia

Reglas trasladadas al [diseño funcional](../01-diseno-funcional.md) —dashboard,
comparaciones, evolución, selectores, ventana de medias y reglas de negocio 24 a
30— y al [diseño técnico](../02-diseno-tecnico.md) —filtros del historial y
consulta del dashboard—. El propietario del producto aprobó estas reglas el
2026-09-06.
