/**
 * OpenSIGE — Syllabus (temario) parsing helpers (T9.12, S3).
 *
 * The three JSON columns of `subject_units` (`subtopics_json`,
 * `instruments`, `criteria`) hold what the SIM published, verbatim.
 * TWO routes read them — the syllabus index (`/temario`) and the
 * per-subject page (`/detalle/[canonicalId]`) — so the parsing lives
 * HERE, once. A second copy would be a second truth about the same
 * column.
 *
 * The contract this module owns, in one sentence: a column that cannot
 * be read must not take a page down. Malformed JSON, a JSON value that
 * is not an array, and a missing column all read as "this row
 * establishes no list" — the unit keeps its title, and the empty list
 * is the truth.
 *
 * Client-safe on purpose: nothing here imports the server-only schema,
 * so the page that renders the parsed units never drags drizzle-orm
 * into the browser bundle.
 */

/** One subtopic of a unit, exactly as the SIM states it. */
export interface Subtopic {
	index: string;
	title: string;
	evalFrom: string | null;
	evalTo: string | null;
}

/** One unit of a syllabus: its number, its title and its evaluation. */
export interface Unit {
	unitNumber: number;
	title: string;
	subtopics: Subtopic[];
	evalFrom: string | null;
	evalTo: string | null;
	instruments: string[];
	criteria: string[];
}

/**
 * The row shape the loaders select from `subject_units`. `instruments`
 * and `criteria` are nullable columns; `subtopics_json` is not, but it
 * is typed nullable here so a hand-written row cannot break the parse.
 */
export interface UnitRow {
	unitNumber: number;
	title: string;
	subtopicsJson: string | null;
	evalFrom: string | null;
	evalTo: string | null;
	instruments: string | null;
	criteria: string | null;
}

/**
 * Parses a JSON array column. Anything that is not an array — a
 * malformed document, an object, a bare number, a NULL column — reads
 * as an empty list, because a list this row does not establish is not
 * a list of one broken element.
 */
export function parseJsonArray(raw: string | null): unknown[] {
	if (raw === null) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

/**
 * A subtopic is only a subtopic if the stored element is an object.
 * `null` and primitives inside the JSON array are real enough to
 * appear — one malformed element must not take the whole page down,
 * so each becomes an empty entry the renderer shows as a blank line
 * rather than a crash.
 */
export function toSubtopic(raw: unknown): Subtopic {
	const o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
	return {
		index: typeof o.index === "string" ? o.index : "",
		title: typeof o.title === "string" ? o.title : "",
		evalFrom: typeof o.evalFrom === "string" ? o.evalFrom : null,
		evalTo: typeof o.evalTo === "string" ? o.evalTo : null,
	};
}

/**
 * The subtopics of a unit. A malformed column yields no subtopics; a
 * malformed ELEMENT yields a blank entry next to the good ones.
 */
export function parseSubtopics(raw: string | null): Subtopic[] {
	return parseJsonArray(raw).map(toSubtopic);
}

/**
 * A string list column (instruments, criteria). Elements that are not
 * strings are dropped: the renderer joins the list as text, and a list
 * of objects would print "[object Object]".
 */
export function parseStringList(raw: string | null): string[] {
	return parseJsonArray(raw).filter((value): value is string => typeof value === "string");
}

/**
 * Turns one `subject_units` row into the unit the pages render. Both
 * loaders go through here, so the two routes can never disagree about
 * what a row says.
 */
export function parseUnit(row: UnitRow): Unit {
	return {
		unitNumber: row.unitNumber,
		title: row.title,
		subtopics: parseSubtopics(row.subtopicsJson),
		evalFrom: row.evalFrom,
		evalTo: row.evalTo,
		instruments: parseStringList(row.instruments),
		criteria: parseStringList(row.criteria),
	};
}

/**
 * The evaluation window of a unit or a subtopic, in words. A window
 * with only one end says so ("Desde …", "Hasta …") instead of
 * inventing the other end, and a row that establishes no window says
 * nothing at all.
 */
export function evaluationWindow(from: string | null, to: string | null): string {
	if (from && to) return `${from} – ${to}`;
	if (from) return `Desde ${from}`;
	if (to) return `Hasta ${to}`;
	return "";
}
