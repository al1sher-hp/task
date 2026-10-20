import dotenv from "dotenv";
import { app } from "./app.js";
import { sequelize } from "./db/sequelize.js";
import "./models/index.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  await sequelize.sync();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
