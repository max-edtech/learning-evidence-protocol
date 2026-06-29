// SPDX-License-Identifier: MPL-2.0

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = path.resolve(import.meta.dirname, "..");
const loadJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(root, relativePath), "utf8"));

const lessonSchema = await loadJson("schema/lesson-contract.schema.json");
const evidenceSchema = await loadJson("schema/run-evidence.schema.json");

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validators = {
  ".contract.json": ajv.compile(lessonSchema),
  ".evidence.json": ajv.compile(evidenceSchema)
};

const exampleNames = (await readdir(path.join(root, "examples"))).sort();
let failed = false;

for (const name of exampleNames) {
  const suffix = Object.keys(validators).find((candidate) =>
    name.endsWith(candidate)
  );

  if (!suffix) {
    continue;
  }

  const value = await loadJson(path.join("examples", name));
  const validate = validators[suffix];

  if (validate(value)) {
    console.log(`✓ ${name}`);
    continue;
  }

  failed = true;
  console.error(`✗ ${name}`);
  for (const error of validate.errors ?? []) {
    console.error(`  ${error.instancePath || "/"} ${error.message}`);
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("All examples conform to LEP 0.1.0.");
}
