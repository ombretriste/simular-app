# SimulaCTRL

Versión 0.2.0 · by OmT Finance

App web (PWA) que simula la amortización anticipada de préstamos e hipotecas, basada en el simulador de
UnderCTRL. Mismo estilo que las demás apps de OmT Finance, en turquesa y arena. Los datos se guardan solo en
el dispositivo (`localStorage`, clave `simular:data`); lo único que se consulta fuera es el Euribor en el BCE.

## Qué hace

- **Préstamo:** capital pendiente, plazo, interés fijo, variable o mixto, comisión por amortizar, comisión por superar un % del capital inicial y seguros.
- **Deducción:** vivienda habitual por comunidad y territorio foral. Solo entran las que dependen de lo que
  se paga cada año, porque son las que cambian el plan. Hay además una deducción personalizada.
- **Previsiones:** Euribor de analistas, de mercado (curva del BCE en directo), sin cambios, ±1 punto o propio;
  rentabilidad del dinero e inflación.
- **Plan:** dinero disponible hoy y cada año. Calcula el escenario recomendado (el de menor carga financiera,
  o el mejor contando lo que rinde tu dinero) y deja crear escenarios propios.
- **Comparar:** capital pendiente, tabla de escenarios y efecto de que el Euribor no acierte.

## Cómo calcula

- `engine.js`: motor sin interfaz. Sistema francés mes a mes. `simulate()` da intereses, deducción, carga
  financiera, valor actual y coste en euros de hoy; `optimize()` busca el reparto por años partiendo de varios
  repartos y moviendo importes mientras mejore; `fillPlan()` completa cada año hasta el tope deducible.
- **Carga financiera** = intereses + comisiones + seguros − deducciones. La deducción se cuenta en junio del
  año siguiente. El año en curso incluye en el tope las cuotas ya pagadas, estimadas con la cuota actual.

## Mantenimiento

Los datos que caducan están al principio de `engine.js`: revisa `FORECASTS` cada trimestre y `REGIONS` en
cada campaña de la Renta. Fuente fiscal: Manual de Renta 2025 de la AEAT; los forales salen de fuentes
secundarias y en Navarra no hay valores por defecto.

Al cambiar archivos: sube `APP_VERSION` en `app.js`, la versión de este README y `CACHE` en `sw.js`.
