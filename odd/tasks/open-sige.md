<!-- odd-tracker
kind: phase-plan
status: active
last-verified: 2026-11-25
branch: (por abrir; el rebrand y F0 arrancan después de que aterricen los PR #14 y #15)
delivery: work-unit commits en ramas de fase, un PR por fase
test-runner: vp check · vp test --run · vp build · just test-e2e · just e2e-dev
continues: odd/tasks/opensim.md (historia del portal del alumno) · odd/manifesto.md (principios)
decide: el mantenedor (2026-11-25) — 30 decisiones de alcance + 12 del manifiesto + 4 de
  plataforma; el plan de fases y la primera piedra (reinscripción) están aprobados
herramientas: vp para lo esencial (check/lint/fmt/test/build) · just para la base de datos
  y las recetas de ciclo completo
riesgo: item 1 (datos persistidos) · item 3 (contratos del dominio) · item 5 (entorno)
-->

# OpenSIGE — del portal del alumno al SIGE de la institución

Creado el 2026-11-25, cuando el mantenedor decidió dejar de inspirarnos en el SIM y
construir nuestro propio sistema de administración universitaria. El nombre es **OpenSIGE**
(sistema integral de gestión educativa, abierto). Este documento es el plan; los principios
viven en [`odd/manifesto.md`](../manifesto.md).

**Lo que no cambia:** la licencia (Unlicense), el `odd/` como bitácora, la documentación en
español y el código y los commits en inglés, el gate del repo (`vp check` + `vp test` +
`vp build` + `just test-e2e`), y la regla de no inventar datos… salvo que ahora el dato
estimado se **etiqueta** en vez de callarse.

**Lo que cambia todo:** el usuario primario deja de ser el alumno y pasa a ser **el personal**
(el back-office). El alumno sigue siendo un usuario de primera clase, pero es un
*consumidor* del mismo estado que el personal produce. Eso invierte el centro de gravedad del
producto: lo que se construye primero son las colas de trabajo del personal, no las pantallas
del alumno.

## Specs

### S1 — Servimos a la institución, en sus dos superficies

Texto del mantenedor (verbatim, 2026-11-25):

> M1 -> A una institución que tiene (o NO tiene) un sistema de administración antiguo, con
> cuellos de botellas y áreas de mejoras ayudando al personal cansando de un sistema
> ineficiente y a los alumnos por tiempos de espera, UI/UX tanto en físico con el personal de
> la institución así como con la app/web app de la institución

Criterio: el sistema tiene **dos superficies sobre un mismo estado**: la ventanilla (el
personal con el expediente en la mano) y la aplicación. Ninguna de las dos es un modo
degradado de la otra: ambas leen y escriben el mismo expediente.

### S2 — Los cinco principios no negociables

Texto del mantenedor (verbatim, 2026-11-25):

> M3 -> Expediente está bien
> M4 -> Semáforo
> M5 -> El sistema es la fuente de la verdad, automatizar sin papel es el futuro aunque algunas
> instituciones usan el papel como verdad para algunos trámites
> M9 -> Diría que append-only y visible al propio

Criterio: los cinco principios de [`odd/manifesto.md`](../manifesto.md) §2 se cumplen en el
código y se pueden citar en las revisiones. El **semáforo** es la unidad de valor de la
interfaz; el expediente es el objeto; la bitácora es append-only y el propio ve su historia.

### S3 — Una identidad, muchas capacidades, otorgadas por puesto

Texto del mantenedor (verbatim, 2026-11-25):

> B1=alumno,egresado,docente,coordinación de carrera y jefatura de dpto, todos los demás roles
> los haremos luego
> B2=d, B3=sí, por ejemplo, nuestro coordinador de carrera actual también es profesor
> B4=por puesto, B5=v1 para solo alumnos, B6=firma electrónica para v2
> M8 -> Sí

Criterio: el acceso es `rol → ámbito → capacidad`. El rol se otorga por **puesto** (catálogo
de cargos). El ámbito es jerárquico (carrera → departamento → campus). Una persona acumula
roles y su acceso es la unión. Los roles de v1 son exactamente cinco; el resto se añade sin
migrar. Los expedientes de v1 son de alumnos (el de personal llega con la firma, en v2).

### S4 — Los datos son de la institución; nosotros damos la tubería

Pregunta del mantenedor (verbatim, 2026-11-25):

> Con todo esto tengo algunas dudas, si somos únicamente los proveedores de plataforma,
> ¿cómo sacamos los datos de materias, planes, cargas, horariso y demás? ¿Solamente demo-only
> de demostración?

Criterio: **tres vías de ingestión** y una regla. Importación (CSV/JSON/SQL → catálogo
normalizado, con reporte de lo no mapeado, que queda visible como "no cargado"); captura en
el sistema por el staff (materias, grupos, docentes, salones, cupos, con validación del
sistema); y un campus de demostración con datos **reales verificados** (el de IT Morelia,
`docs/data/*` + `scripts/build-verified-curriculum.py`, que ya es un importador). Regla: todo
dato lleva **procedencia** (origen, quién lo capturó, cuándo). No hay datos de ejemplo de
fábrica que se puedan confundir con los de una institución.

### S5 — Las reglas son de la institución; OpenSIGE sólo las sabe leer

Pregunta del mantenedor (verbatim, 2026-11-25):

> ¿Con qué te refieres con el Manual de Lineamientos? ¿Eso no debería definirlo la institución?

Criterio: el *Manual de Lineamientos Académico-Administrativos del Tecnológico Nacional de
México* (normateca de tecnm.mx; caps. 5 evaluación, 6 traslado, 7 convalidación, 8 movilidad,
9 equivalencias, 14 titulación integral) es la fuente inicial que transcribimos a mano como
**reglas versionadas** (`id`, `source_article`, `statement`, `scope`, `version`,
`effective_from`, `effective_to`), y el Manual del ITM + los acuerdos del Comité Académico
**sobrescriben** al nacional en el perfil de la institución. Cada expediente cita la regla
que le aplicó. Las excepciones del comité son objetos del dominio (una resolución citable),
no condiciones en el código. Hoy esas reglas viven en `src/lib/utils/dag.ts`: en F0 pasan a
ser datos.

### S6 — Kernel, distro y extensiones: la institución como distribución

Idea del mantenedor (verbatim, 2026-11-25):

> Debido al nuevo surgimiento de la IA agéntica y demás podríamos adaptar algún .md para que
> una IA modifique, añada, agregue y construya todo el sistema tomando OpenSIGE como base,
> algo así como hacer las distribuciones de Linux que toman el kernel (OpenSIGE) y luego le
> ponen su capa de personalización (instituciones objetivo)

Criterio: **núcleo** (identidad, capacidades, expedientes, semáforo, bitácora, editor de
catálogo, motor de oferta, importadores, suite de conformidad) + **distro** (un perfil
declarativo por institución: identidad, catálogo con procedencia, reglas, roles/puestos,
edificios/salones/docentes, calendario, conceptos de cobro, procedimientos, marca, locale) +
**extensiones** (plugins para lo que ningún perfil expresa; nunca un fork). Lo que hace que
una personalización —incluida la escrita por una IA— sea aceptable es la **suite de
conformidad**: un perfil que no la pasa no es un perfil. El contrato del perfil y el
playbook de extensión se publican como `.md` para que los agentes los lean.

### S7 — El calendario es dato y el dinero es un libro mayor

Textos del mantenedor (verbatim, 2026-11-25):

> C6=Me gusta tu catálogo por conceptos + campus/semestres
> M7 -> Pago confirmado por la institución
> R2 -> Sí, lo deciden y arman los directivos antes de que un semestre nuevo entre, aunque
> también se podría armar semestre a semestre

Criterio: las ventanas (reinscripción, bajas, recuperaciones, exámenes, verano) se cargan
como datos y los workflows las consultan; el calendario lo arman los directivos por ciclo
(o semestre a semestre) y el sistema lo versiona. El dinero es un libro mayor de conceptos
(cuota por campus y semestre) y el estado de un pago lo **confirma la institución**, no el
estudiante.

### S8 — La primera piedra es la reinscripción; la carga y horarios entran en v1

Textos del mantenedor (verbatim, 2026-11-25):

> L4 -> Vamos con tu recomendación
> L7 -> Metamos también el plan de carga y horario a v1

Criterio: el primer expediente de punta a punta es la **reinscripción** (prueba en un solo
golpe el semáforo, el rol, el calendario, el dinero y la bitácora). El **plan de carga y
horarios** (edificios, salones, docentes, secciones, cupos, conflictos) también entra en v1:
es la parte más compleja y la que más valor da al personal.

### S9 — El nombre, la licencia y el idioma

Textos del mantenedor (verbatim, 2026-11-25):

> E6 -> Creo que podríamos cambiarlo a OpenSIGE o algo parecido, dime si hay algún nombre
> parecido ocupado para cambiar de branding
> M10 -> OpenSIGE me gusta, sigamos manteniendo @odd/ y todo lo demás en español pero el
> código y los commits estrictamente en inglés
> M11 -> Sigamos Unlicense, sin cambios
> M12 -> Público desde el día 1, ya es público y la transición hacia OpenSIGE también lo será

Criterio: el proyecto se llama OpenSIGE; `OpenSIM` y `SIE` quedan fuera (SIE ya lo usan los
planteles como nombre de su propio sistema). "OpenSIGE" está libre en npm y GitHub; los
dominios `opensige.org` / `.dev` / `.mx` no resuelven, lo que **no** prueba que estén
libres (hay que confirmarlo en un registrador). El rebrand del **código** ocurre en F0; el
nombre del repositorio en GitHub se conserva hasta el final para no romper enlaces a mitad
de camino. La licencia sigue siendo Unlicense.

### S10 — vp para lo esencial, just para la base de datos

Texto del mantenedor (verbatim, 2026-11-25):

> G3 -> Tenemos vp como unified toolchain por lo que podemos lintear todo el proyecto mediante
> 'vp' (vite+ que uso vitest para test) y demás utilidades, dale preferencia a vp para
> comandos esenciales y a just comandos de base de datos y demás por decir un ejemplo

Criterio: los comandos esenciales del ciclo se invocan con **vp** (`vp check`, `vp lint`,
`vp fmt`, `vp test --run`, `vp build`); **just** queda para las recetas de base de datos
(`just db-migrate`, `just db-seed`, `just db-set-password`) y las de ciclo completo. Las
receetas `just` que envuelven a `vp` siguen existiendo como puertas (`just qa-fast`).

## Arquitectura

### La tubería de los datos

```
origen ──► importador ──► catálogo normalizado ──► validaciones ──► catálogo vivo
   │             │                 │                    │
   │             │                 │                    └── huecos: "no cargado" (visibles)
   │             │                 └── procedencia: origen, quién, cuándo
   │             └── CSV / JSON / SQL / paquete `catalog` del HQ
   └── captura en el sistema por el staff (materias, grupos, docentes, salones, cupos)
```

El catálogo tiene tres capas: **nacional** (HQ: programas, planes, materias, créditos,
prerrequisitos, versionados), **local** (campus: secciones, docentes, salones, horarios,
cupos) y **transversal** (reglas, calendario, conceptos de cobro, roles). El campus consume
el nacional; en v2 puede proponer cambios.

### El modelo de las reglas

```
rule(id, source_article, statement, scope, version, effective_from, effective_to)
expediente ──► rule_applied(expediente_id, rule_id, rule_version, evidence)
resolución del comité ──► exception(scope, decision, evidence, effective_from)
```

`evaluateCreditThresholds` y las constantes de `dag.ts` pasan a ser una consulta a `rule` en
F0. El expediente guarda la versión de la regla que aplicó, de modo que cambiar un umbral
no reescribe la historia de nadie.

### El estado del expediente

Máquina de estados por tipo de trámite (XState v5: `getPersistedSnapshot()` para persistir
en D1, `getNextEvents()` para derivar **la cola del personal** y **el semáforo del alumno**
del mismo estado, y la inspection API para el event sourcing que da la bitácora). Los
umbrales y requisitos viven en `rule`, no en los guards del código.

### El modelo de capacidades

```
puesto (catálogo de cargos) ──► rol ──► ámbito (carrera/departamento/campus)
                                              └──► capacidad (ver, capturar, validar,…)
```

La decisión de E2 queda: plugin `admin` de Better Auth + **tabla de permisos propia**. El
bloqueo del correo (Better Auth exige `email` en el usuario) se resuelve con el correo
sintético `12345678@sige.invalid`, etiquetado como no institucional — permitido por D1
relajado.

## Fases

| Fase | Entrega | Specs | Semanas |
| --- | --- | --- | --- |
| **F0** | El cimiento: rebrand del código · esquema del perfil + validador · identity + rol→ámbito→capacidad · núcleo de expediente (máquina de estados + bitácora) · suite de conformidad mínima · las reglas de `dag.ts` pasan a ser datos | S2, S3, S5, S9, S10 | 1–3 |
| **F1** | La reinscripción de punta a punta: calendario como dato · conceptos de cobro + libro mayor (pago confirmado) · cita y selección autorizada · semáforo en las dos superficies · bitácora visible al propio | S1, S2, S7 | 3–6 |
| **F2** | Carga y horarios: edificios/salones/docentes/secciones · plan de oferta · detección de conflictos · cupos · reserva | S1, S8 | 6–10 |
| **F3** | Catálogo editable y versionado: editor de materias/prerrequisitos/oferta · planes de estudio versionados · importador CSV/JSON con reporte de huecos | S4, S5 | 8–12 |
| **F4** | La distro: contrato del perfil (`.md` + esquema) · playbook de extensión (`.md`) · skills de agente · suite de conformidad completa · primer perfil real (IT Morelia con los datos verificados) | S4, S6 | 10–14 |

Horizonte declarado por el mantenedor (2026-11-25): *6-8 semanas* para el primer hito, con
3-4 h/día de una persona más el asistente, *sin urgencia comercial*.

**Orden imposed por el repo:** el rebrand de código (F0) **arranca después** de que
aterricen los PR #14 (stack a `latest` + adapter-cloudflare 9) y #15 (T9.13): un rebrand
antes chocaría con los mismos archivos (`package.json`, `docs/deploy.md`, `odd/README.md`).
Cada fase cierra con su gate y con un manifiesto de verificación.

### Verificación por fase

```bash
# esencial (vp)
vp check                 # formato + lint + tipos
vp test --run            # unitarias
vp build                 # build de producción

# base de datos y recetas (just)
just db-migrate          # aplica migraciones a la D1 local
just db-set-password     # aprovisiona la credencial
just test-e2e            # Playwright + axe-core contra la D1 local
just e2e-dev             # carril agéntico (modelo real) — sólo cuando el carril cambia
```

## Riesgos

| Riesgo | Item | Mitigación |
| --- | --- | --- |
| Cambiar el nombre del Worker crea un Worker nuevo en producción y deja el viejo sirviendo el demo | 5 | El rebrand de F0 **no** toca `wrangler.jsonc`'s `name`; el rename del Worker es una operación de producción que pide autorización explícita y un plan de corte (URL vieja y nueva). |
| La base D1 no se renombra (`wrangler d1` no tiene `rename`): crear + copiar + repuntar cambia el `database_id` | 1 | Se conserva el nombre "opensim" como identificador interno; la marca vive en el código y en la interfaz. |
| Perder la trazabilidad de los expedientes al migrar el modelo de `student_profiles` a los objetos del dominio | 1, 3 | El modelo nuevo **extiende** el existente, no lo reemplaza: F0 agrega tablas, no las recrea; las migraciones siguen la numeración a mano del repo. |
| Que las reglas se dupliquen entre `dag.ts` y la tabla `rule` | 3 | F0 mueve la definición a `rule` y deja `dag.ts` como lector; una prueba falla si divergen. |
| Que las personalizaciones se conviertan en forks | 3 | Perfil declarativo + suite de conformidad + regla explícita: el núcleo no se edita para acomodar a una institución. |

## Decisiones que siguen abiertas

- Nombre de los dominios (`opensige.org` / `.dev` / `.mx`): confirmar disponibilidad real en un
  registrador y decidir.
- Forma final de la API de extensiones (plugins): se decide en F4, con el primer perfil real
  como caso de prueba.
- La API pública del núcleo (para integraciones): se decide con el primer perfil.

## Log

- **2026-11-25 — Plan creado.** El mantenedor decidió dejar de inspirarnos en el SIM y
  construir un SIGE propio: **OpenSIGE**, producto abierto con licencia Unlicense, donde el
  usuario primario es el personal y el alumno es otro consumidor del mismo estado. Se
  aprueban 30 decisiones de alcance, 12 del manifiesto y 4 de plataforma. El manifiesto
  (cinco principios) queda en `odd/manifesto.md` con tres enmiendas aprobadas: *las reglas
  son de la institución*, *todo dato tiene procedencia* y *somos una plataforma, no un
  proveedor de datos; la institución es una distro*. Este plan fija las cinco fases
  (F0 cimiento → F4 distro), la primera piedra (el expediente de reinscripción) y la entrada
  del plan de carga y horarios en v1. Herramientas: `vp` para lo esencial, `just` para la
  base de datos. El rebrand del código espera a que aterricen los PR #14 y #15.
