/**
 * OpenSIGE — axe-core WCAG 2.1 AA scan: /detalle/[canonicalId] (T9.12).
 *
 * Every protected route has its own sweep file, because the gate is
 * per route, not per app. This one has TWO scans because the page
 * renders two different trees: the subject with a published syllabus
 * (cards, lists, badges) and the subject the portal never published
 * (the empty state, which is the one that can hide a heading or a
 * landmark).
 */
import { test } from "@playwright/test";

import { scanForA11y } from "./_helpers";

test.use({ storageState: "playwright/.auth/storage.json" });

test("detalle has no serious/critical WCAG 2.1 AA violations", async ({ page }, testInfo) => {
	await page.goto("/detalle/sca-1025");
	await scanForA11y(page, testInfo);
});

test("detalle without a published syllabus has no serious/critical violations", async ({
	page,
}, testInfo) => {
	await page.goto("/detalle/acf-0901");
	await scanForA11y(page, testInfo);
});
