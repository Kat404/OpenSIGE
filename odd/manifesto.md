<!--
  OpenSIGE — Manifiesto.
  Documento público desde el día 1: define qué es el proyecto y qué no se negocia.
  Revisión pendiente del mantenedor (borrador 1, 2026-11-25).
  -->

# Manifiesto OpenSIGE

> **Sistema Integral de Gestión Educativa, abierto.**
> El sistema de administración de una institución de educación superior que no obliga a
> escoger entre papel y software: el expediente vive en el sistema, el papel es la excepción
> que se declara, y la persona —alumno o personal— siempre sabe en qué estado está lo suyo.

## 1. A quién servimos

Servimos a **la institución** que tiene un sistema de administración antiguo, con cuellos de
botella, o que no tiene ninguno y improvisa con hojas de cálculo. Servimos a las dos caras
de ese problema:

- **Al personal**, que está cansado de un sistema ineficiente: los mismos datos se capturan
  dos veces, los trámites se pierden en bandejillas y nadie sabe qué está esperando a quién.
- **Al alumnado**, que pierde tiempo en esperas sin saber si le falta un documento, una firma
  o un curso.

Y operamos en **dos superficies**, porque la institución es física antes que digital: la
**ventanilla** (el personal con el expediente en la mano) y la **aplicación** (quien lo lleva
consigo). Las dos leen y escriben el mismo estado; no son dos sistemas.

## 2. Los cinco principios no negociables

### 1. El expediente es el producto, y su estado es lo que se ve

Cada trámite vive en un **expediente**: el conjunto de evidencias (documentos, aprobaciones,
constancias) y el estado en que se encuentra. La unidad de valor de la interfaz es el
**semáforo**: en qué paso está, qué falta y quién tiene la pelota. Todo lo demás —pantallas,
reportes, correos— es una forma de leer el estado del expediente.

### 2. El sistema es la fuente de verdad

Automatizar sin papel es el futuro, y es la dirección del proyecto. Cuando una institución
mantenga el papel como verdad para un trámite concreto, **el sistema lo declara** en lugar de
inventar un estado que no existe: se marca como tramitándose fuera del sistema, con su
responsable y su fecha. La duplicidad de fuentes es un defecto a la vista, no una decisión.

### 3. Una identidad, muchas capacidades

El acceso no se concede por persona sino por **capacidad**, y las capacidades viven en un
**ámbito**: `rol → ámbito → capacidad`. El rol se otorga por **puesto** (el catálogo de cargos
de la institución), nunca "porque esta persona conoce al director". El ámbito es jerárquico:
la coordinación de una carrera ve su carrera, la jefatura de departamento ve su área, la
dirección ve el campus. Una persona puede tener varios roles a la vez —un coordinador que
también imparte— y su acceso es la unión de los que le tocan.

### 4. Lo que no sabemos, se dice

Ningún dato aparece sin origen. Si el plan no declara el semestre de una materia, la interfaz
muestra que no está registrado; si un dato es estimado, está **etiquetado como estimado** con
su método. Preferimos una pantalla con una duda honesta a un sistema que rellena huecos y
pierde credibilidad el primer día.

### 5. Todo acto deja rastro

La bitácora es **append-only**: nada se borra, nada se edita; una corrección es un asiento
nuevo. Es visible para **quien la generó** (el alumno ve su historia) y para quien responde
por el trámite. La auditoría no es una función que se agrega después: es una propiedad del
modelo desde el primer día, aunque la primera versión priorice el producto.

## 3. De aquí se derivan

- **El calendario es dato.** Fechas de reinscripción, bajas, recuperaciones, exámenes y
  cursos de verano se cargan como datos y los workflows se los preguntan; ningún PDF se
  reinterpreta a mano.
- **El dinero es un libro mayor.** La cuota es un concepto del catálogo (por campus, por
  semestre), y el estado de un pago lo confirma la institución, no el estudiante.
- **El catálogo es nacional; la oferta es local.** Las materias y los planes de estudio los
  define la instancia central (el HQ) y el campus los consume; el campus administra la
  **oferta**: secciones, docentes, salones, horarios y cupos. En v2 el campus podrá proponer
  cambios al catálogo.
- **Las reglas son de la institución, y son datos.** OpenSIGE no decide qué exige una
  institución: sólo sabe leer sus reglas. Las transcribe a una forma versionada y fechable
  (artículo, condición, ámbito) para que cada expediente cite la que le aplicó y el sistema
  sepa, por sí solo, qué falta; y para que cambiar un umbral no reescriba la historia de
  nadie. Las excepciones que resuelve un comité son objetos del dominio, no condiciones
  escondidas en el código.
- **Todo dato tiene procedencia.** Origen, quién lo capturó y cuándo. Un catálogo importado
  conserva su origen; uno capturado, la persona. Lo que no se sabe se declara como no
  cargado: nunca se rellena con datos de fábrica que alguien pueda confundir con los
  propios.
- **Dos superficies, un estado.** La ventanilla y la aplicación leen y escriben lo mismo; el
  personal ve sus colas, el alumnado ve su semáforo.
- **Documentación en español, código en inglés.** Los commits, el código, los nombres de
  tabla y de función van en inglés; los documentos, los mensajes de interfaz y este manifiesto
  van en español.
- **Licencia Unlicense.** Sin cambio: máximo libertad de uso, modificación y redistribución.
- **Manifiesto público desde el día 1**, y la transición de OpenSIM a OpenSIGE también es
  pública y gradual.

## 4. Lo que vamos a ser

- El **expediente vivo** de cada alumno: historial, estados, semáforo, documento a documento.
- El **tablero del personal**: la cola de lo que me toca, ordenada por antigüedad y riesgo,
  con la evidencia a la vista y la acción a un clic.
- El **plan de carga y horarios** como un tablero de verdad: secciones, docentes, salones,
  cupos y conflictos resueltos antes de que el alumno elija.
- El **catálogo que el staff edita** (materias, créditos, prerrequisitos, oferta), con
  versionado para que un cambio de plan no reescriba la historia de nadie.
- La **captura de calificaciones** con validación de jefatura y publicación al kardex.
- Los **trámites completos** con estado, responsable y evidencia: reinscripción, bajas,
  cambio de carrera, equivalencia, convalidación, tránsito, movilidad, constancias, servicio
  social, residencia, titulación.
- El **calendario institucional** como dato, con sus ventanas, sus cierres y sus descansos.
- Las **extraescolares** (clubes, talleres, deportes, cultura) con inscripción, horas y
  resultados, y su constancia puente hacia los créditos complementarios.
- La **vida estudiantil** que también atendemos: orientación y asesorías, salud,
  biblioteca y clubes de lectura, eventos.
- El **catálogo de conceptos de cobro** por campus y semestre, con su libro mayor.
- **Roles, ámbitos y capacidades** como un solo modelo, con bitácora de todo lo que se hace.
- **Una plataforma, no un proveedor de datos:** el núcleo (identidad, capacidades,
  expedientes, semáforo, bitácora, catálogo, oferta) más el **perfil de cada institución**
  como una distribución: sus datos, sus reglas, sus cargos, su calendario, su marca. El
  perfil es declarativo y se valida contra una **suite de conformidad**; una
  personalización —incluso escrita por una IA— que no la pasa no es una personalización.
- Un **proyecto abierto** (Unlicense, issues públicas, hoja de ruta pública) que otra
  institución pueda desplegar tal cual.

## 5. Lo que no vamos a ser

- **No** una red social (ni feed, ni chat, ni gamificación del expediente).
- **No** un LMS: no reproduce clases ni construye lecciones.
- **No** un ERP de finanzas: el libro mayor registra lo que la institución cobra, no la
  contabilidad del instituto.
- **No** un CRM de egresados ni una bolsa de trabajo.
- **No** un gestor documental genérico: el documento que guardamos es evidencia de un
  expediente, con su estado.
- **No** un turnero de ventanilla sin contexto: la cola viene con el expediente y la
  capacidad que la desbloquea.
- **No** un clon del SIM: si una institución ya tiene un sistema, OpenSIGE debe poder
  convivir con él, no reemplazarlo a la fuerza.
- **No** un proveedor de datos: los datos de una institución son de la institución. No
  empaquetamos catálogos de ejemplo que se puedan confundir con los de nadie.
- **No** un núcleo que se edita para acomodar a una institución: eso es un fork, y un fork
  no se puede auditar. Lo que un perfil no exprese se resuelve con una extensión.
- **No** un modelo por institución con datos copiados: la referencia y la experiencia se
  comparten, los datos de cada institución no.

## 6. Cómo decidimos

Producto primero, auditoría después — con la bitácora ya instrumentada desde el primer
commit. La verdad se establece con evidencia observada (pruebas, mediciones, registros), no
con consenso. Lo que no se puede verificar no se afirma. Las decisiones que cambian el
alcance se registran y se pueden revertir; las que cambian los principios, no.

El nombre es **OpenSIGE**: sistema integral de gestión educativa, abierto. Se evita "SIM"
(por lo que dejamos de copiar) y "SIE" (que ya usan los planteles como nombre de su propio
sistema).
