/**
 * OpenSIGE — Per-subject detail loader (T9.12).
 *
 * The page behind `/detalle/[canonicalId]`: one subject of the plan,
 * with the facts the catalogue holds about it and the syllabus the
 * portal published for it.
 *
 * Two rules shape this loader:
 *
 *   1. A `canonicalId` that is not in the catalogue is a 404, not an
 *      empty page. A student who mistypes a slug must be told the
 *      subject does not exist, not shown a page about nothing.
 *   2. A row that cannot be read must not take the page down. A unit
 *      with malformed JSON keeps its title and reads as no subtopics
 *      (see `#lib/utils/temario`); a prerequisite whose subject row
 *      is gone simply does not appear in the list.
 *
 * The subject's own facts are read from `subjects`; the units from
 * `subject_units`; the prerequisites from `subject_prerequisites`,
 * whose edge reads "the row names the subject that REQUIRES the
 * prerequisite" — so the rows for this subject are the ones whose
 * `subject_canonical_id` is this subject, and the other end of the
 * edge is the prerequisite.
 */

import { error } from "@sveltejs/kit";
import { env as workerEnv } from "cloudflare:workers";
import { asc, eq, sql } from "drizzle-orm";

import { getDb } from "#lib/server/db";
import {
	type SubjectComponent,
	type SubjectSeriationState,
	specialties,
	subjectPrerequisites,
	subjects,
	subjectUnits,
} from "#lib/server/db/schema";
import { parseUnit, type Unit } from "#lib/utils/temario";

import type { OpenSigeWorkerEnv } from "../../../../cloudflare-workers";
import type { PageServerLoad } from "./$types";

const env = workerEnv as OpenSigeWorkerEnv;

/** One prerequisite of the subject, with the identity the list shows. */
export interface DetallePrerequisite {
	canonicalId: string;
	code: string;
	name: string;
}

/**
 * Everything the page knows about one subject. The nullable fields are
 * nullable ON PURPOSE: `area` is unclassified across the whole
 * verified plan (H4) and `semester`/`ht`/`hp` are unknown for the 16
 * specialty modules (H8). A null is a fact — "no source establishes
 * this" — and the page says so in words instead of hiding the field.
 */
export interface DetalleSubject {
	canonicalId: string;
	code: string;
	name: string;
	semester: number | null;
	credits: number;
	area: string | null;
	ht: number | null;
	hp: number | null;
	/** Stored tri-state: `UNKNOWN` means "not established from a source". */
	seriationState: SubjectSeriationState;
	component: SubjectComponent;
	specialtyCode: string | null;
	/** The specialty's name, when the subject belongs to one. */
	specialtyName: string | null;
	units: Unit[];
	prerequisites: DetallePrerequisite[];
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const u = locals.user;
	if (!u) return { subject: null };
	if (!env.DB) return { subject: null };

	const db = getDb(env.DB);
	const canonicalId = params.canonicalId;

	const [subjectRows, unitRows, prerequisiteRows] = await Promise.all([
		// The identity, plus the specialty's name in the same round trip:
		// a LEFT JOIN keeps the row when the subject has no specialty.
		db
			.select({
				canonicalId: subjects.canonicalId,
				code: subjects.code,
				name: subjects.name,
				semester: subjects.semester,
				credits: subjects.credits,
				area: subjects.area,
				ht: subjects.ht,
				hp: subjects.hp,
				seriationState: subjects.seriationState,
				component: subjects.component,
				specialtyCode: subjects.specialtyCode,
				// `subjects` and `specialties` BOTH have a `name` column, and
				// Drizzle maps a result row by COLUMN NAME: selecting
				// `specialties.name` next to `subjects.name` would overwrite
				// the subject's own name with the specialty's (null for every
				// subject without a specialty). The explicit alias gives the
				// column a name of its own, so both survive.
				specialtyName: sql<string | null>`${specialties.name}`.as("specialty_name"),
			})
			.from(subjects)
			.leftJoin(specialties, eq(subjects.specialtyCode, specialties.code))
			.where(eq(subjects.canonicalId, canonicalId)),
		db
			.select({
				unitNumber: subjectUnits.unitNumber,
				title: subjectUnits.title,
				subtopicsJson: subjectUnits.subtopicsJson,
				evalFrom: subjectUnits.evalFrom,
				evalTo: subjectUnits.evalTo,
				instruments: subjectUnits.instruments,
				criteria: subjectUnits.criteria,
			})
			.from(subjectUnits)
			.where(eq(subjectUnits.subjectCanonicalId, canonicalId))
			.orderBy(asc(subjectUnits.unitNumber)),
		// The edge reads "this subject REQUIRES the other one", so the
		// prerequisites of this subject are the rows that name it.
		db
			.select({
				canonicalId: subjects.canonicalId,
				code: subjects.code,
				name: subjects.name,
			})
			.from(subjectPrerequisites)
			.innerJoin(subjects, eq(subjectPrerequisites.prerequisiteCanonicalId, subjects.canonicalId))
			.where(eq(subjectPrerequisites.subjectCanonicalId, canonicalId))
			.orderBy(asc(subjects.code)),
	]);

	const row = subjectRows[0];
	if (!row) {
		error(404, "La materia no existe en el catálogo del plan de estudios.");
	}

	const subject: DetalleSubject = {
		canonicalId: row.canonicalId,
		code: row.code,
		name: row.name,
		semester: row.semester,
		credits: row.credits,
		area: row.area,
		ht: row.ht,
		hp: row.hp,
		// SQLite stores TEXT; the domain unions are enforced here.
		seriationState: row.seriationState as SubjectSeriationState,
		component: row.component as SubjectComponent,
		specialtyCode: row.specialtyCode,
		specialtyName: row.specialtyName,
		units: unitRows.map(parseUnit),
		prerequisites: prerequisiteRows.map((p) => ({
			canonicalId: p.canonicalId,
			code: p.code,
			name: p.name,
		})),
	};

	return { subject };
};
