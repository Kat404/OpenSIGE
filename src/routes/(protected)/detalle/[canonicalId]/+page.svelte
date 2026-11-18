<!--
  OpenSIM — Detalle de una materia (T9.12).

  One subject of the plan, with the facts the catalogue holds about it
  and the syllabus the portal published for it.

  The page's honesty rule: a NULL is a fact, not a bug. `area` is
  unclassified across the whole verified plan (H4) and `semester`,
  `ht` and `hp` are unknown for the 16 specialty modules (H8), so
  those fields are stated in words ("sin clasificar", "sin semestre")
  instead of being hidden or filled with an invented value.

  And when the portal published no syllabus for the subject, the page
  says WHY: the SIM publishes the temario only for the subjects of
  the active period. That is a limit of the source, not a defect of
  the institution, and the wording must not read like one.
-->
<script lang="ts">
import { Badge, Card, EmptyState } from "#lib/components/ui";
import { evaluationWindow } from "#lib/utils/temario";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

const subject = $derived(data.subject);

/**
 * The Spanish label of the stored seriation tri-state. `UNKNOWN` is
 * "not established from a source" — never "not serialized" — so it
 * reads as "sin clasificar" and never as "independiente".
 */
function seriationLabel(state: string): string {
	if (state === "SERIALIZED") return "Seriada";
	if (state === "INDEPENDENT") return "Independiente";
	return "Sin clasificar";
}

/** The one sentence that says what the tri-state actually means. */
function seriationHint(state: string): string {
	if (state === "SERIALIZED") {
		return "El plan la registra como materia seriada: tiene un orden respecto a otras.";
	}
	if (state === "INDEPENDENT") {
		return "El plan la registra como materia independiente, sin orden respecto a otras.";
	}
	return "Ninguna fuente consultada establece si esta materia debe seriada.";
}

/** The Spanish label of the stored curricular component. */
function componentLabel(component: string): string {
	if (component === "COMPLEMENTARY") return "Complementaria";
	if (component === "PRACTICE") return "Práctica";
	if (component === "SPECIALTY") return "Especialidad";
	return "Genérica";
}

/** The hours a subject declares, in words when it declares none. */
function hoursText(ht: number | null, hp: number | null): string {
	if (ht === null && hp === null) return "sin horas registradas";
	const theory = ht === null ? "sin horas de teoría" : `${ht} h de teoría`;
	const practice =
		hp === null ? "sin horas de práctica" : `${hp} h de práctica`;
	return `${theory} · ${practice}`;
}
</script>

<svelte:head>
	<title>{subject ? `${subject.code} — ${subject.name} — OpenSIM` : "Detalle de materia — OpenSIM"}</title>
	<meta
		name="description"
		content={subject
			? `Datos del plan y temario publicado de ${subject.code}.`
			: "Detalle de una materia del plan de estudios."}
	/>
</svelte:head>

<section class="detalle">
	<header class="detalle__header">
		<p class="detalle__eyebrow">Materia</p>
		<h1 class="detalle__title">{subject ? subject.name : "Detalle de materia"}</h1>
		{#if subject}
			<p class="detalle__badges">
				<Badge variant="brand" size="md">{subject.code}</Badge>
			</p>
		{/if}
	</header>

	{#if !subject}
		<section class="detalle__section" aria-labelledby="detalle-catalogo">
			<h2 class="detalle__section-title" id="detalle-catalogo">Catálogo de materias</h2>
			<div class="detalle__status" role="status">
				<EmptyState
					title="No se pudo consultar el catálogo de materias"
					description="La base de datos del plan no está disponible en este momento. Vuelve a intentarlo más tarde."
				/>
			</div>
		</section>
	{:else}
		<Card padding="md" title="Datos de la materia">
			<dl class="detalle__fields">
				<div class="detalle__field">
					<dt class="detalle__label">Semestre</dt>
					<dd class="detalle__value">
						{subject.semester === null ? "sin semestre" : subject.semester}
					</dd>
				</div>
				<div class="detalle__field">
					<dt class="detalle__label">Créditos</dt>
					<dd class="detalle__value">{subject.credits}</dd>
				</div>
				<div class="detalle__field">
					<dt class="detalle__label">Área</dt>
					<dd class="detalle__value">{subject.area ?? "sin clasificar"}</dd>
				</div>
				<div class="detalle__field">
					<dt class="detalle__label">Horas de teoría y práctica</dt>
					<dd class="detalle__value">{hoursText(subject.ht, subject.hp)}</dd>
				</div>
				<div class="detalle__field">
					<dt class="detalle__label">Seriación</dt>
					<dd class="detalle__value">
						<Badge variant="neutral" size="sm">{seriationLabel(subject.seriationState)}</Badge>
						<span class="detalle__hint">{seriationHint(subject.seriationState)}</span>
					</dd>
				</div>
				<div class="detalle__field">
					<dt class="detalle__label">Componente</dt>
					<dd class="detalle__value">{componentLabel(subject.component)}</dd>
				</div>
				<div class="detalle__field">
					<dt class="detalle__label">Especialidad</dt>
					<dd class="detalle__value">{subject.specialtyName ?? "sin especialidad"}</dd>
				</div>
			</dl>
		</Card>

		<section class="detalle__section" aria-labelledby="detalle-unidades">
			<h2 class="detalle__section-title" id="detalle-unidades">
				Unidades del temario
				<Badge variant="neutral" size="sm">{subject.units.length}</Badge>
			</h2>
			{#if subject.units.length === 0}
				<div class="detalle__status" role="status">
					<EmptyState
						title="El portal no publica el temario de esta materia"
						description="El portal del SIM publica el temario sólo de las materias del periodo activo, no de todo el plan. Esta materia no está entre las publicadas, así que no hay unidades que mostrar. No significa que la institución no tenga temario para ella."
					/>
				</div>
			{:else}
				<ol class="detalle__units">
					{#each subject.units as unit (unit.unitNumber)}
						<li>
							<Card>
								{#snippet header()}
									<h3 class="detalle__unit-title">
										<span class="detalle__unit-number">Unidad {unit.unitNumber}</span>
										{unit.title}
									</h3>
								{/snippet}
								{#if evaluationWindow(unit.evalFrom, unit.evalTo)}
									<p class="detalle__window">
										Evaluación: {evaluationWindow(unit.evalFrom, unit.evalTo)}
									</p>
								{/if}
								{#if unit.subtopics.length > 0}
									<ol class="detalle__subtopics">
										{#each unit.subtopics as subtopic, index (`${unit.unitNumber}-${index}`)}
											<li class="detalle__subtopic">
												{#if subtopic.index}
													<span class="detalle__subtopic-index">{subtopic.index}</span>
												{/if}
												<span class="detalle__subtopic-title">{subtopic.title}</span>
												{#if evaluationWindow(subtopic.evalFrom, subtopic.evalTo)}
													<span class="detalle__subtopic-window">
														{evaluationWindow(subtopic.evalFrom, subtopic.evalTo)}
													</span>
												{/if}
											</li>
										{/each}
									</ol>
								{/if}
								{#if unit.instruments.length > 0}
									<p class="detalle__label">Instrumentos de evaluación</p>
									<ul class="detalle__badges">
										<!-- The catalogue can list the same instrument twice, so the
										     position is part of the key: a keyed block with a repeated
										     key is a runtime error in Svelte. -->
										{#each unit.instruments as instrument, index (`${index}-${instrument}`)}
											<li><Badge variant="info" size="sm">{instrument}</Badge></li>
										{/each}
									</ul>
								{/if}
								{#if unit.criteria.length > 0}
									<p class="detalle__label">Criterios de evaluación</p>
									<ul class="detalle__badges">
										{#each unit.criteria as criterion, index (`${index}-${criterion}`)}
											<li><Badge variant="neutral" size="sm">{criterion}</Badge></li>
										{/each}
									</ul>
								{/if}
							</Card>
						</li>
					{/each}
				</ol>
			{/if}
		</section>

		<section class="detalle__section" aria-labelledby="detalle-prerrequisitos">
			<h2 class="detalle__section-title" id="detalle-prerrequisitos">Prerrequisitos</h2>
			{#if subject.prerequisites.length === 0}
				<p class="detalle__note">El plan no registra prerrequisitos para esta materia.</p>
			{:else}
				<ul class="detalle__prerequisites">
					{#each subject.prerequisites as prerequisite (prerequisite.canonicalId)}
						<li>
							<a class="detalle__prereq" href="/detalle/{prerequisite.canonicalId}">
								<span class="detalle__prereq-code">{prerequisite.code}</span>
								<span class="detalle__prereq-name">{prerequisite.name}</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</section>

<style>
.detalle {
	display: flex;
	flex-direction: column;
	gap: var(--space-5);
}

.detalle__header {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.detalle__eyebrow {
	margin: 0;
	font-size: var(--text-xs);
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--fg-tertiary);
}

.detalle__title {
	margin: 0;
	font-size: var(--text-2xl);
	font-weight: var(--weight-semibold);
	color: var(--fg-primary);
}

.detalle__badges {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-2);
	margin: 0;
}

.detalle__section {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.detalle__section-title {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	margin: 0;
	font-size: var(--text-md);
	font-weight: var(--weight-semibold);
	color: var(--fg-primary);
}

.detalle__fields {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: var(--space-3);
	margin: 0;
}

.detalle__field {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.detalle__label {
	margin: 0;
	font-size: var(--text-xs);
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--fg-tertiary);
}

.detalle__value {
	margin: 0;
	font-size: var(--text-sm);
	color: var(--fg-primary);
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--space-2);
}

.detalle__hint {
	font-size: var(--text-xs);
	color: var(--fg-tertiary);
}

.detalle__note {
	margin: 0;
	font-size: var(--text-sm);
	color: var(--fg-tertiary);
}

.detalle__units {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	margin: 0;
	padding: 0;
	list-style: none;
}

.detalle__unit-title {
	margin: 0;
	font-size: var(--text-sm);
	font-weight: var(--weight-medium, 500);
	color: var(--fg-primary);
}

.detalle__unit-number {
	color: var(--fg-tertiary);
	margin-right: var(--space-1);
}

.detalle__window {
	margin: 0;
	font-size: var(--text-xs);
	color: var(--fg-tertiary);
}

.detalle__label {
	margin: 0;
	font-size: var(--text-xs);
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--fg-tertiary);
}

.detalle__subtopics {
	display: flex;
	flex-direction: column;
	gap: 2px;
	margin: 0;
	padding-left: var(--space-4);
	list-style: none;
}

.detalle__subtopic {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: var(--space-2);
	font-size: var(--text-xs);
	color: var(--fg-secondary);
}

.detalle__subtopic-index {
	font-weight: var(--weight-semibold);
	color: var(--fg-tertiary);
}

.detalle__subtopic-window {
	color: var(--fg-tertiary);
}

.detalle__badges {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-2);
	margin: 0;
	padding: 0;
	list-style: none;
}

.detalle__prerequisites {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	margin: 0;
	padding: 0;
	list-style: none;
}

.detalle__prereq {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: var(--space-2);
	font-size: var(--text-sm);
	color: var(--brand-700);
	text-decoration: none;
}

.detalle__prereq:hover {
	text-decoration: underline;
}

.detalle__prereq-code {
	font-weight: var(--weight-semibold);
}

.detalle__prereq-name {
	color: var(--fg-secondary);
}
</style>
