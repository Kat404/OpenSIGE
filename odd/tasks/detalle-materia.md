<!-- odd-tracker
kind: phase-plan
status: active
last-verified: 2026-10-28
branch: feat/detalle-materia
delivery: work-unit commits en la rama de feature
test-runner: just qa-fast · just test-e2e
continues: odd/tasks/vite-plus-migration.md (toolchain unificada)
decide: el mantenedor (2026-10-28) — la siguiente feature es `/detalle`, y la higiene
  (LICENSE, tag v0.1.0, account_id) quedó cerrada en el mismo día. El `LICENSE` se borró
  el 2026-11-18: duplicaba el `UNLICENSE`, que el repo tenía desde el primer commit.
-->

# `/detalle` — la página por materia

Creado el 2026-10-28. La página donde una materia explica su temario. Los datos ya existen —
`subject_units` tiene 32 filas y 223 subtemas para 7 de las 68 materias — y hasta ahora sólo
se ven como un índice global dentro de `/temario`.

**No es T9.12:** esa tarea se cerró con la vista `/temario` (la cobertura explícita, commit
`756246a`, `odd/tasks/phase-9-ui-integration.md`). Esta es su continuación: la misma fuente de
datos, servida materia por materia.

## Specs

### S1 — La página de la materia existe y dice la verdad sobre su temario

Texto del mantenedor (verbatim, de la pregunta del 2026-10-28):

> /detalle — la página por materia

Criterio: la ruta protegida **`/detalle/[canonicalId]`** muestra la identidad de la materia
(código, nombre, semestre, créditos, área, HT/HP, estado de seriación, especialidad) y sus
unidades: número, título, ventana de evaluación, subtemas con su propia ventana, instrumentos
y criterios. Cuando la materia **no** tiene temario, la página dice **por qué** —el portal sólo
publica el temario del periodo activo— y no culpa a la institución. Una `canonicalId`
desconocida responde 404.

### S2 — Es alcanzable desde donde el estudiante busca el temario

Cada materia de `/temario` (las dos listas: con temario y sin él) enlaza a su página de
detalle. El enlace es un `<a>` de verdad, no un `onclick`.

### S3 — El parseo del temario no se duplica ni se rompe

El parseo de `subtopics_json`, `instruments` y `criteria` sale del loader de `/temario` a un
módulo compartido y **las dos** rutas lo usan. Una fila con JSON malformado no tumba ninguna
de las dos páginas: la unidad conserva su título y la lista vacía es la verdad.

### S4 — La página cumple las reglas del repo

UI en español (es-MX), código y comentarios en inglés, tokens de `src/lib/styles/tokens.css`,
sin dependencias nuevas, WCAG 2.1 AA (los barridos de axe-core pasan también en esta ruta,
como en las demás rutas protegidas).

## Tasks

| ID | Specs | Ruta | Estado | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1, S2, S3, S4 | la ruta, el módulo compartido, los enlaces, las specs | cerrado | `feat(detalle)` |

## Verificación observada

| Comprobación | Resultado |
| --- | --- |
| `vp check` | 0 errores · 127 archivos formateados · los 6 avisos del baseline del repo, ninguno en un archivo tocado |
| `vp test --run` | **406/406** en 27 archivos (387 + 19 nuevos del módulo compartido) |
| `svelte-check` | 0 errores, 0 avisos |
| `just test-e2e` | **234 verdes, 0 rojos**, 160 saltados (por diseño): las 5 specs de `/detalle` y las 2 del barrido de axe-core nunca se habían corrido en un navegador, y ahora sí |

**El bug que el worker encontró y corrigió (y que nadie habría visto en la revisión del
diff):** `leftJoin(specialties, …)` hacía que `specialties.name` **sobrescribiera**
`subjects.name` en la fila del resultado. El mecanismo está una capa más abajo de lo que se
cree: el driver D1 de miniflare convierte cada fila en un objeto **por nombre de columna**
(`Object.fromEntries(columns.map((name, i) => [name, row[i]]))`), así que dos columnas
`name` colapsan en una sola clave (gana la última) y Drizzle después lee ese objeto de
forma **posicional** (`row[columnIndex]`). El nombre de la materia se perdía en cada fila.
El arreglo es un alias explícito (`sql<string|null>`${specialties.name}`.as("specialty_name")`):
`alias()` no basta, porque sigue devolviendo el nombre de la columna.

**Dos decisiones que el worker dejó tomadas y que conviene conocer:**

1. El enlace de `/temario` a `/detalle` vive **fuera** del `<details>` a propósito: `<summary>`
   lleva el rol `button` y su `childrenPresentational` convierte cualquier enlace dentro en una
   violación de `nested-interactive` de axe-core.
2. `parseStringList` descarta los elementos que no son cadenas, donde el parser en línea los
   conservaba. Es invisible en cada fila sembrada (el chequeo diferencial lo prueba sobre las
   32 unidades y los 223 subtemas reales: la salida de `/temario` es idéntica) y sólo se ve en
   una fila editada a mano, donde el contrato de S3 dice que la lista honesta es la verdad.

## Log

- **2026-10-28 — Creado.** El mantenedor eligió `/detalle` como siguiente feature y
  (LICENSE + tag + `account_id`) como higiene. La higiene quedó cerrada antes de este
  documento: `LICENSE` (The Unlicense, que el repo ya tenía como `UNLICENSE` desde el
  primer commit), `account_id` en `wrangler.jsonc` (la trampa del 7403) y el primer tag
  del repo, `v0.1.0`, anotado y firmado con GPG.
- **2026-10-28 — Hecha y verificada.** El worker construyó la ruta, extrajo el parseo a
  `src/lib/utils/temario.ts` (las dos rutas lo usan; `/temario` no cambia de salida) y escribió
  las specs. El padre corrió la suite e2e completa: **234 verdes**, incluidas las 5 specs de
  `/detalle` y las 2 del barrido de axe-core de la ruta nueva.
- **2026-10-28 — `.vscode/` sale del repo.** El mantenedor no usa VSCode y borró el directorio:
  `svelte-kit sync` reescribe `.vscode/extensions.json` en cada `just check`, así que el
  archivo versionado era ruido que el gate tocaba. Ahora está en `.gitignore` y el árbol
  sigue limpio después de la puerta.
- **2026-11-18 — El `LICENSE` sale del repo.** El mantenedor lo borró: el `UNLICENSE` —el
  texto de The Unlicense, que el repo tiene desde el primer commit— ya decía lo mismo, y
  los dos archivos diferían en un carácter (`unlicense.org/` contra `unlicense.org`). La
  detección de licencia de GitHub no pierde nada: `UNLICENSE` casa con la misma expresión
  que `LICENSE` (licensee: `LICENSE_REGEX = /(un)?licen[sc]e/i`, puntuación 1.00), así que
  la API `/license` sigue contestando `Unlicense` con `file: UNLICENSE`. De paso, el
  `Containerfile.ci` declaraba `org.opencontainers.image.licenses="MIT"` y el README no
  decía nada de la licencia aunque `AGENTS.md` señalaba este README: ahora el README tiene
  su sección y el contenedor dice Unlicense.
