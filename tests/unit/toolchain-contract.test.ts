/**
 * OpenSIGE — The two contracts the toolchain upgrade put in writing.
 *
 * `@sveltejs/adapter-cloudflare` 9 moved the built worker and the static
 * assets, and the adapter now REJECTS a `main` that points into
 * `.svelte-kit/cloudflare`. The pnpm pin moved to the version the host
 * has on its PATH. Neither is visible to the type checker: a stale path
 * here breaks the build or the deploy, not a test.
 *
 * So they are asserted here, the way `scheduled-prune.test.ts` asserts
 * the injector's statements — the file IS the contract.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

// Relative to this file, not to the process cwd: the runner may not
// start in the repository root.
const root = (path: string) => fileURLToPath(new URL(`../../${path}`, import.meta.url));
const read = (path: string) => readFileSync(root(path), "utf8");

const wrangler = read("wrangler.jsonc");
const injector = read("scripts/inject-scheduled-handler.mjs");
const pkg = JSON.parse(read("package.json")) as {
	packageManager: string;
	scripts: Record<string, string>;
};

describe("the adapter-cloudflare 9 build layout", () => {
	it("leaves the worker entry to the adapter", () => {
		expect(wrangler).not.toContain('"main"');
	});

	it("serves the static assets from the client directory", () => {
		expect(wrangler).toContain('"directory": ".svelte-kit/cloudflare/client"');
	});

	it("keeps the cron trigger", () => {
		expect(wrangler).toContain('"crons": ["0 */6 * * *"]');
	});

	it("injects the scheduled handler into the worker the adapter emits", () => {
		expect(injector).toContain('const WORKER_PATH = ".svelte-kit/cloudflare/worker/index.js";');
	});

	it("never points at the pre-adapter-9 worker file", () => {
		expect(pkg.scripts.preview).not.toMatch(/_worker\.js/);
	});
});

describe("the pnpm pin", () => {
	it("is the same version in the image and in the docs", () => {
		const version = pkg.packageManager.replace(/^pnpm@/, "");
		expect(read("Containerfile.ci")).toContain(`pnpm@${version}`);
		expect(read("docs/ci-local.md")).toContain(`pnpm@${version}`);
	});
});
