/** Create an MCP API key from the CLI:  npx tsx scripts/create-key.ts "label" [read|read_write] */
import { createApiKey } from "../src/lib/api-keys";

const label = process.argv[2] ?? "cli";
const scope = process.argv[3] === "read" ? "read" : "read_write";
createApiKey(label, scope).then(({ raw }) => {
  console.log(raw);
  process.exit(0);
});
