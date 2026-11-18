/**
 * OpenSIM — /detalle/[canonicalId] functional spec (T9.12, S1, S2).
 *
 * The per-subject page: one subject of the plan, with the facts the
 * catalogue holds about it and the syllabus the portal published for
 * it.
 *
 * The assertions are about the page's HONESTY, not about decoration:
 *   - a subject with a published syllabus shows its units, their
 *     subtopics and their evaluation windows;
 *   - a subject the portal never published says WHY, in words that do
 *     not blame the institution;
 *   - a canonicalId that is not in the catalogue answers 404, not an
 *     empty page;
 *   - every subject of /temario links to its own detail page.
 *
 * The fixtures are the seeded catalogue (`just db-seed`), not test
 * doubles: SCA-1025 is one of the 7 subjects the portal publishes and
 * the only one of them with a prerequisite edge (AEF-1031).
 */
import { expect, test } from "@playwright/test";

test.use({ storageState: "playwright/.auth/storage.json" });

/** SCA-1025: published syllabus, one prerequisite, no specialty. */
const WITH_SYLLABUS = "/detalle/sca-1025";
/** ACF-0901: a subject of the plan the portal publishes no temario for. */
const WITHOUT_SYLLABUS = "/detalle/acf-0901";

test("the page shows the subject's identity and its published units", async ({ page }) => {
	await page.goto(WITH_SYLLABUS);

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Taller de Base de Datos");
	await expect(page.getByText("SCA-1025", { exact: true })).toBeVisible();

	// The identity card states the catalogue's facts — and states the
	// gaps in words. `area` is unclassified across the whole plan (H4),
	// so the page says "sin clasificar" instead of hiding the field.
	const identity = page.locator("section.detalle section.card").filter({ hasText: "Área" });
	await expect(identity.getByText("sin clasificar", { exact: true })).toBeVisible();
	await expect(identity.getByText("Seriada", { exact: true })).toBeVisible();
	await expect(identity.getByText("Genérica", { exact: true })).toBeVisible();
	await expect(identity.getByText("sin especialidad", { exact: true })).toBeVisible();
	// SCA-1025 declares 0 h of theory and 4 h of practice.
	await expect(
		identity.getByText("0 h de teoría · 4 h de práctica", { exact: true }),
	).toBeVisible();

	// The units, with their own evaluation window and their subtopics.
	const unitOne = page
		.locator("section.detalle section.card")
		.filter({ hasText: "LENGUAJE DE DEFINICIÓN DE DATOS" });
	await expect(unitOne.getByRole("heading", { name: /Unidad 1/ })).toBeVisible();
	await expect(
		unitOne.getByText("Evaluación: 07/09/2026 – 11/09/2026", { exact: true }),
	).toBeVisible();
	await expect(unitOne.getByText("1.1 INSTALACIÓN DE UN SGBD", { exact: true })).toBeVisible();
	await expect(unitOne.getByText("24/08/2026 – 28/08/2026", { exact: true })).toBeVisible();

	// The instruments and the criteria are badges of the unit.
	await expect(unitOne.getByText("CÁTEDRA DOCENTE", { exact: true })).toBeVisible();
	await expect(unitOne.getByText("PRÁCTICAS EN LABORATORIO", { exact: true })).toBeVisible();
});

test("the page lists the prerequisites, each one linking to its own detail page", async ({
	page,
}) => {
	await page.goto(WITH_SYLLABUS);

	const prerequisite = page.getByRole("link", { name: /AEF-1031/ });
	await expect(prerequisite).toHaveAttribute("href", "/detalle/aef-1031");
	await expect(
		prerequisite.getByText("Fundamentos de Bases de Datos", { exact: true }),
	).toBeVisible();
});

test("a subject the portal does not publish says why it has no temario", async ({ page }) => {
	await page.goto(WITHOUT_SYLLABUS);

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cálculo Diferencial");
	await expect(
		page.getByRole("heading", {
			name: "El portal no publica el temario de esta materia",
		}),
	).toBeVisible();
	// The cause is named, and it is the PORTAL's limit, not a defect of
	// the institution.
	await expect(
		page.getByText(/No significa que la institución no tenga temario para ella\./),
	).toBeVisible();
});

test("a canonicalId that is not in the catalogue answers 404", async ({ page }) => {
	const response = await page.goto("/detalle/no-existe-en-el-catalogo");

	expect(response?.status()).toBe(404);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("No encontramos esa página.");
});

test("every subject of /temario links to its own detail page", async ({ page }) => {
	await page.goto("/temario");

	// The coverage line carries how many subjects the plan has.
	const coverage = page.getByText(/materias tienen temario publicado/);
	const text = await coverage.textContent();
	const total = Number(text?.match(/de\s+(\d+)\s+materias/)?.[1]);
	expect(total).toBeGreaterThan(0);

	// One link per subject, in BOTH lists (with a syllabus and without).
	await expect(page.locator('a[href^="/detalle/"]')).toHaveCount(total);

	// And the link is a real <a> pointing at the subject's own slug.
	const link = page.getByRole("link", { name: "Ver detalle de SCA-1025" });
	await expect(link).toHaveAttribute("href", "/detalle/sca-1025");
});
