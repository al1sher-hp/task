import { beforeEach } from "vitest";
import { sequelize } from "../src/db/sequelize.js";
import "../src/models/index.js";

/** Resets the in-memory SQLite schema before every test so each test is isolated. */
export function resetDb() {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });
}
