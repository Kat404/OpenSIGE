/**
 * OpenSIM — Contract of the shared syllabus parser (T9.12, S3).
 *
 * The contract in one sentence: a column that cannot be read must not
 * take a page down. This file pins the EDGE of that contract with
 * inputs the sibling spec does not use, so a future refactor that
 * tightens the parser cannot quietly narrow it.
 *
 * The inputs below are the ones a hand-edited or truncated row can
 * really hold: whitespace, a boolean, an array of numbers, nested
 * arrays, an object element, an empty-string evaluation window.
 */
import { describe, expect, it } from "vite-plus/test";

import {
	evaluationWindow,
	parseJsonArray,
	parseStringList,
	parseSubtopics,
	parseUnit,
} from "#lib/utils/temario";

describe("the column that cannot be read", () => {
	it("reads whitespace and a boolean as no list at all", () => {
		expect(parseJsonArray("   ")).toEqual([]);
		expect(parseJsonArray("true")).toEqual([]);
		expect(parseJsonArray("false")).toEqual([]);
	});

	it("reads an array of numbers as no STRING list, but as blank subtopics", () => {
		expect(parseStringList("[1,2,3]")).toEqual([]);
		expect(parseSubtopics("[1,2,3]")).toHaveLength(3);
		expect(parseSubtopics("[1,2,3]")[0]).toEqual({
			index: "",
			title: "",
			evalFrom: null,
			evalTo: null,
		});
	});

	it("reads nested arrays as blank subtopics, not as a crash", () => {
		expect(parseSubtopics("[[1],[2]]")).toHaveLength(2);
		expect(parseSubtopics("[[1],[2]]")[0].title).toBe("");
	});

	it("drops an object element from a string list", () => {
		expect(parseStringList('["CÁTEDRA",{"a":1}]')).toEqual(["CÁTEDRA"]);
	});
});

describe("parseUnit keeps the row's title when every column is broken", () => {
	it("survives a row whose three JSON columns are unreadable", () => {
		const unit = parseUnit({
			unitNumber: 7,
			title: "UNIDAD CON TODO ROTO",
			subtopicsJson: "{not json",
			evalFrom: null,
			evalTo: null,
			instruments: "esto no es json",
			criteria: '{"no":"es un array"}',
		});
		expect(unit.title).toBe("UNIDAD CON TODO ROTO");
		expect(unit.subtopics).toEqual([]);
		expect(unit.instruments).toEqual([]);
		expect(unit.criteria).toEqual([]);
	});
});

describe("evaluationWindow does not invent an end", () => {
	it("reads an empty string as no window at all", () => {
		expect(evaluationWindow("", "")).toBe("");
		expect(evaluationWindow("", "28/08/2026")).toBe("Hasta 28/08/2026");
		expect(evaluationWindow("24/08/2026", "")).toBe("Desde 24/08/2026");
	});
});
