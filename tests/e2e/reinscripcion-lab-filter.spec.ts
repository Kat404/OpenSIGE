/**
 * OpenSIM — /reinscripcion laboratory filter (T9.14).
 *
 * The SIM marks an offering row with a flask when the group carries a
 * laboratory (`course_groups.has_lab`), and the filter narrows the offer to
 * those rows. The narrowing happens in SQL, so the count the panel reports
 * is the narrowed one and not the whole catalogue — the same contract the
 * text and credit filters already have.
 *
 * Read-only: nothing here enrolls, so the local D1 keeps the state the next
 * run expects.
 */
import { expect, test } from "@playwright/test";

test.use({ storageState: "playwright/.auth/storage.json" });

test("the laboratory filter narrows the offer to the groups that carry one", async ({ page }) => {
	await page.goto("/reinscripcion");

	const panel = page.getByTestId("filter-panel");
	// Unanchored on purpose: Playwright matches a regex against the element's
	// own text, and the badge's text carries the surrounding whitespace.
	const count = panel.getByText(/\d+ grupos/).first();
	const before = Number((await count.innerText()).replace(/\D/g, ""));

	await panel.getByLabel("Laboratorio").selectOption("1");
	await panel.getByRole("button", { name: "Filtrar" }).click();

	await expect(page).toHaveURL(/lab=1/);

	const after = Number((await count.innerText()).replace(/\D/g, ""));
	expect(after).toBeGreaterThan(0);
	// The whole catalogue is 475 groups; the ones with a laboratory are a
	// fraction of it.
	expect(after).toBeLessThan(before);

	// Every row the filter kept is a group with a laboratory — the same
	// "Lab" badge the row already carried before the filter existed.
	const metas = page.getByTestId("offer-list").locator(".simulator__row-meta");
	const rows = await metas.count();
	expect(rows).toBeGreaterThan(0);
	for (let i = 0; i < rows; i++) {
		await expect(metas.nth(i)).toContainText("Lab");
	}
});
