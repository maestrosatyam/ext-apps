import { describe, expect, it } from "bun:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

// zod/v4 re-exports its non-English locales as a `locales` namespace. esbuild
// and Bun 1.3 drop them only when zod/v4 is imported as a namespace
// (`import * as z from "zod/v4"`); with a named `import { z }` they keep every
// locale in the bundle.
async function bundledZodLocales(entry: string): Promise<string[]> {
  const result = await build({
    entryPoints: [fileURLToPath(new URL(entry, import.meta.url))],
    bundle: true,
    write: false,
    metafile: true,
    format: "esm",
    platform: "browser",
    logLevel: "silent",
  });
  const [output] = Object.values(result.metafile.outputs);
  return Object.entries(output.inputs)
    .filter(
      ([path, input]) =>
        /zod\/v4\/locales\//.test(path) && input.bytesInOutput > 0,
    )
    .map(([path]) => path.replace(/.*zod\/v4\/locales\//, ""))
    .filter((locale) => locale !== "en.js");
}

describe("zod locales", () => {
  for (const entry of ["./app.ts", "./app-bridge.ts"]) {
    it(`are not bundled with ${entry.slice(2)} (except en)`, async () => {
      expect(await bundledZodLocales(entry)).toEqual([]);
    });
  }
});
