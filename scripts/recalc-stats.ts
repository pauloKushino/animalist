// Recalcula nota ponderada, membros e ranking de todos os animes.
//   npm run anime:stats
import { db } from "./db";
import { recalculateAllStats } from "@/server/stats";

recalculateAllStats(db)
  .then(() => console.log("Notas e ranking recalculados."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
