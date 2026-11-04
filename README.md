# SimulaCTRL

Versión 0.4.2 · by OmT Finance

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
- **UnderCTRL (⋯ → UnderCTRL):** con el usuario y la contraseña de UnderCTRL se derivan aquí sus claves y se
  lee su nube (acción `pull`, solo lectura; UnderCTRL 1.48.1+ la admite desde otra web). Se guarda solo un
  resumen (`simular:ucData`): préstamos, ahorro previsto de cada proyección, dinero líquido y no líquido por
  perfil y flujos de las inversiones. En Préstamo se carga un préstamo; en Plan se elige el perfil (persona,
  común o total) y se aplican el líquido menos el colchón, el ahorro previsto y la rentabilidad esperada
  (media de la TIR propia y de una estimación de mercado por clase, `UC_CLASSES`).

## Cómo calcula

- `engine.js`: motor sin interfaz. Sistema francés mes a mes. `simulate()` da intereses, deducción, carga
  financiera, valor actual y coste en euros de hoy; `optimize()` busca el reparto por años partiendo de varios
  repartos y moviendo importes mientras mejore; `fillPlan()` completa cada año hasta el tope deducible.
- **Carga financiera** = intereses + comisiones + seguros − deducciones. La deducción se cuenta en junio del
  año siguiente. El año en curso incluye en el tope las cuotas ya pagadas, estimadas con la cuota actual.

## Seguridad

- `vercel.json` envía una política de seguridad (CSP), como UnderCTRL y DocCTRL: solo se ejecuta el código de la
  propia app y solo se conecta a su servidor, al BCE (`data-api.ecb.europa.eu`, Euribor) y a la nube de
  UnderCTRL (`finanzas-app-gules-three.vercel.app`). No se puede incrustar en otra web; `nosniff`, `no-referrer` y sin cámara, micrófono ni ubicación
  (`Permissions-Policy`).
- Los datos se validan al cargar (`cleanLoan` para lo guardado, `ucExtract` para lo que llega de UnderCTRL):
  solo pasan identificadores, textos acotados, números finitos, opciones conocidas y fechas válidas. Los textos
  se escapan siempre al mostrarse.
- En el dispositivo los datos no están cifrados (`localStorage`). El vínculo con UnderCTRL guarda las claves
  derivadas, no la contraseña: quien tenga el dispositivo puede leer UnderCTRL hasta que se desconecte.
- No hay scripts en línea: lo que va antes de pintar está en `boot.js`. No añadas `<script>` en línea ni
  atributos `on…=`, o la CSP los bloqueará.

## Mantenimiento

Los datos que caducan están al principio de `engine.js`: revisa `FORECASTS` cada trimestre y `REGIONS` en
cada campaña de la Renta. Fuente fiscal: Manual de Renta 2025 de la AEAT; los forales salen de fuentes
secundarias y en Navarra no hay valores por defecto.

Al cambiar archivos: sube `APP_VERSION` en `app.js`, la versión de este README y `CACHE` en `sw.js`.
