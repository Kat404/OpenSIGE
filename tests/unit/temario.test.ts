/**
 * OpenSIGE — Syllabus parsing helpers (T9.12, S3).
 *
 * The three JSON columns of `subject_units` (`subtopics_json`,
 * `instruments`, `criteria`) hold what the SIM published, verbatim.
 * TWO routes read them — the syllabus index (`/temario`) and the
 * per-subject page (`/detalle/[canonicalId]`) — so the parsing lives
 * in one module and these tests pin its contract.
 *
 * The contract in one sentence: a column that cannot be read must not
 * take a page down. Malformed JSON, a JSON value that is not an array,
 * and a missing column all read as "this row establishes no list" —
 * the unit keeps its title, and the empty list is the truth.
 */
import { describe, expect, it } from "vite-plus/test";

import {
	evaluationWindow,
	parseJsonArray,
	parseStringList,
	parseSubtopics,
	parseUnit,
	toSubtopic,
} from "#lib/utils/temario";

describe("parseJsonArray", () => {
	it("returns the array when the column holds one", () => {
		expect(parseJsonArray('["a","b"]')).toEqual(["a", "b"]);
	});

	it("falls back to an empty list on malformed JSON", () => {
		// The seeded rows are well-formed; a hand-edited or truncated
		// column is not, and it must not take the page down.
		expect(parseJsonArray("no es json")).toEqual([]);
		expect(parseJsonArray("[unclosed")).toEqual([]);
		expect(parseJsonArray("")).toEqual([]);
	});

	it("falls back to an empty list when the JSON is not an array", () => {
		expect(parseJsonArray('{"index":"1.1"}')).toEqual([]);
		expect(parseJsonArray('"texto"')).toEqual([]);
		expect(parseJsonArray("7")).toEqual([]);
		expect(parseJsonArray("null")).toEqual([]);
	});

	it("reads a missing column as an empty list", () => {
		expect(parseJsonArray(null)).toEqual([]);
	});
});

describe("toSubtopic", () => {
	it("keeps the fields a stored subtopic establishes", () => {
		expect(
			toSubtopic({
				index: "1.1",
				title: "IMPACTO",
				evalFrom: "24/08/2026",
				evalTo: "28/08/2026",
			}),
		).toEqual({
			index: "1.1",
			title: "IMPACTO",
			evalFrom: "24/08/2026",
			evalTo: "28/08/2026",
		});
	});

	it("turns a primitive element into a blank entry instead of crashing", () => {
		// `null`, a string and a number all appear in a hand-edited
		// column. One malformed element must not take the whole unit
		// down, so each becomes an empty entry the renderer shows as a
		// blank line.
		expect(toSubtopic(null)).toEqual({
			index: "",
			title: "",
			evalFrom: null,
			evalTo: null,
		});
		expect(toSubtopic("texto")).toEqual({
			index: "",
			title: "",
			evalFrom: null,
			evalTo: null,
		});
		expect(toSubtopic(7)).toEqual({
			index: "",
			title: "",
			evalFrom: null,
			evalTo: null,
		});
	});

	it("drops a field that is not the type the column promises", () => {
		expect(toSubtopic({ index: 1, title: null, evalFrom: 24 })).toEqual({
			index: "",
			title: "",
			evalFrom: null,
			evalTo: null,
		});
	});
});

describe("parseSubtopics", () => {
	it("reads the subtopics of a well-formed row", () => {
		expect(parseSubtopics('[{"index":"1.1","title":"OK"}]')).toEqual([
			{ index: "1.1", title: "OK", evalFrom: null, evalTo: null },
		]);
	});

	it("keeps a blank entry for every malformed element and drops none", () => {
		const parsed = parseSubtopics('[null,"texto",7,{"index":"1.1","title":"OK"}]');
		expect(parsed).toHaveLength(4);
		expect(parsed[0]).toEqual({
			index: "",
			title: "",
			evalFrom: null,
			evalTo: null,
		});
		expect(parsed[3]).toEqual({
			index: "1.1",
			title: "OK",
			evalFrom: null,
			evalTo: null,
		});
	});

	it("reads a malformed or missing column as no subtopics at all", () => {
		expect(parseSubtopics("no es json")).toEqual([]);
		expect(parseSubtopics(null)).toEqual([]);
	});
});

describe("parseStringList", () => {
	it("keeps the stored strings", () => {
		expect(parseStringList('["CÁTEDRA DOCENTE"]')).toEqual(["CÁTEDRA DOCENTE"]);
	});

	it("reads a missing list as an empty list", () => {
		// `instruments` and `criteria` are nullable columns: a row that
		// establishes no list must render as no list, not as a hole.
		expect(parseStringList(null)).toEqual([]);
	});

	it("reads a malformed or non-array column as an empty list", () => {
		expect(parseStringList("no es json")).toEqual([]);
		expect(parseStringList('{"a":1}')).toEqual([]);
	});

	it("drops an element that is not a string", () => {
		expect(parseStringList('["CÁTEDRA DOCENTE",7,null]')).toEqual(["CÁTEDRA DOCENTE"]);
	});
});

describe("parseUnit", () => {
	it("parses a full row into a unit", () => {
		const unit = parseUnit({
			unitNumber: 1,
			title: "UNIDAD 1",
			subtopicsJson: '[{"index":"1.1","title":"IMPACTO"}]',
			evalFrom: "24/08/2026",
			evalTo: "28/08/2026",
			instruments: '["CÁTEDRA DOCENTE"]',
			criteria: '["EVALUACIÓN ESCRITA"]',
		});
		expect(unit).toEqual({
			unitNumber: 1,
			title: "UNIDAD 1",
			subtopics: [{ index: "1.1", title: "IMPACTO", evalFrom: null, evalTo: null }],
			evalFrom: "24/08/2026",
			evalTo: "28/08/2026",
			instruments: ["CÁTEDRA DOCENTE"],
			criteria: ["EVALUACIÓN ESCRITA"],
		});
	});

	it("keeps the title of a row whose JSON columns cannot be read", () => {
		const unit = parseUnit({
			unitNumber: 1,
			title: "UNIDAD 1",
			subtopicsJson: "no es json",
			evalFrom: null,
			evalTo: null,
			instruments: null,
			criteria: null,
		});
		expect(unit.title).toBe("UNIDAD 1");
		expect(unit.subtopics).toEqual([]);
		expect(unit.instruments).toEqual([]);
		expect(unit.criteria).toEqual([]);
		expect(unit.evalFrom).toBeNull();
		expect(unit.evalTo).toBeNull();
	});
});

describe("evaluationWindow", () => {
	it("reads a window with both ends", () => {
		expect(evaluationWindow("24/08/2026", "28/08/2026")).toBe("24/08/2026 – 28/08/2026");
	});

	it("reads a half-open window without inventing the other end", () => {
		expect(evaluationWindow("24/08/2026", null)).toBe("Desde 24/08/2026");
		expect(evaluationWindow(null, "28/08/2026")).toBe("Hasta 28/08/2026");
	});

	it("reads no window as no text", () => {
		expect(evaluationWindow(null, null)).toBe("");
	});
});
