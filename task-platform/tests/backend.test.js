import test from "node:test";
import assert from "node:assert";

// Minimal smoke test - placeholder for the CI pipeline to have something
// real to run. Expand with supertest + a test DB as the project grows.
test("sanity check", () => {
  assert.strictEqual(1 + 1, 2);
});
