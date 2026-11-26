/**
 * OpenSIGE — Playwright + axe-core audit configuration (Phase 5 Tarea 5.1).
 *
 * Uses Playwright's own Chromium by default. One command gives every
 * host the exact browser the tests were written against
 * (`pnpm exec playwright install chromium`), with no system package to
 * install or to keep in sync with Playwright's expectations. The CI
 * image (Containerfile.ci) already ships Chromium via apt and points
 * `PLAYWRIGHT_CHROMIUM_PATH` at it, so the image carries no extra
 * download.
 *
 * The dev server is auto-managed via `webServer` — Playwright spawns
 * `pnpm dev` for the suite and tears it down at the end. The
 * `reuseExistingServer: !process.env.CI` line keeps iterative dev
 * fast on the developer machine: if a dev server is already on
 * :5173 the test reuses it. There is no cloud-CI consumer setting
 * `CI=true` anymore — the only consumer is local Podman via
 * `just ci-shell` (interactive debugging), which sets `CI=true`
 * for the e2e spec's retry behaviour, not the webServer block.
 *
 * D1 is a local Miniflare binding driven by wrangler; tests assume a
 * migrated database with the test credential provisioned. The
 * `just test-e2e` recipe wires that up (`db-migrate db-set-password`)
 * and is non-destructive. For a pristine database instead, use
 * `just test-e2e-fresh`, which does delete local state. NOTE: `just ci`
 * (the pre-push container gate) does NOT run this e2e suite — it
 * runs `just qa-fast` (check + vp-check + test). For axe-core
 * e2e coverage, run `just test-e2e` on the host.
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Playwright's own Chromium by default; `PLAYWRIGHT_CHROMIUM_PATH`
 * points the runner at another build — the CI image (Containerfile.ci)
 * installs Chromium with apt and sets it, so the image ships no
 * Playwright download.
 */
const LAUNCH_OPTIONS = {
	...(process.env.PLAYWRIGHT_CHROMIUM_PATH
		? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
		: {}),
	args: ["--no-sandbox", "--disable-dev-shm-usage"],
};

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	workers: 1, // D1 local is single-writer; serial avoids flake
	// CI gets one retry to absorb transient network/timing flake; local
	// dev is single-shot for fast feedback. `trace: 'retain-on-failure'`
	// (Task 5 fix) records the trace on every failure, not only on the
	// retry — the previous `on-first-retry` was contradictory with
	// `retries: 0` and never produced traces.
	retries: process.env.CI ? 1 : 0,
	reporter: [
		["list"],
		["json", { outputFile: "tests/e2e/reports/results.json" }],
		["html", { outputFolder: "tests/e2e/reports/html", open: "never" }],
	],
	use: {
		baseURL: BASE_URL,
		trace: "retain-on-failure",
		headless: true,
		launchOptions: LAUNCH_OPTIONS,
	},
	projects: [
		{
			name: "setup",
			testMatch: /.*\.setup\.ts/,
			use: {
				launchOptions: LAUNCH_OPTIONS,
			},
		},
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				colorScheme: "light",
			},
			dependencies: ["setup"],
		},
		{
			// mcode round-7 N16: the previous sweep only ran in light.
			// Dark mode inverts the brand scale (--brand-700 becomes
			// #67e8f9 in dark) and the previous "10/10 verde" was
			// lucky. Re-run every spec against a dark color scheme to
			// catch the cases that only fail in dark.
			name: "chromium-dark",
			use: {
				...devices["Desktop Chrome"],
				colorScheme: "dark",
			},
			dependencies: ["setup"],
		},
		{
			// Audit R8-4 + R9 NUEVO-1: `chromium-dark` only sets the
			// OS colorScheme — `[data-theme='dark']` (the path the
			// toggle button actually takes) is structurally unreachable
			// in tests. This project exercises that path by injecting
			// `data-theme="dark"` synchronously before any module runs,
			// on top of a LIGHT OS so the script alone sets the theme.
			// Without it, every token added only to the
			// `[data-theme='dark']` block is invisible to CI.
			name: "chromium-data-theme-dark",
			use: {
				...devices["Desktop Chrome"],
				colorScheme: "light",
			},
			dependencies: ["setup"],
		},
	],
	webServer: {
		command: "pnpm dev",
		url: BASE_URL,
		// Dev-machine UX: if a dev server is already on :5173, reuse
		// it. `just test-e2e` is the only path that spawns a fresh
		// webServer every run and tears it down — the `just ci`
		// pre-push container gate does NOT run e2e. No consumer sets
		// CI=true to get a fresh start anymore, but the flag stays
		// for cross-environment robustness (e.g. CI runners in the
		// future that may opt in).
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});
