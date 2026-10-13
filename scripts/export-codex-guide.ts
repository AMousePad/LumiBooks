import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { t } from "../src/i18n";

// Keep the existing readable guide; the JSON catalog is its editable source.
writeFileSync(join(import.meta.dir, "../src/codex.md"), t("guides.codex.markdown"));
