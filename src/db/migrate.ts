import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";

migrate(db, { migrationsFolder: "./drizzle" })
  .then(() => {
    console.log("migrated");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
