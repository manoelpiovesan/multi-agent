import 'dotenv/config';
import {initDb} from "./config/sequelize";
import app from "./app";


const PORT = process.env.APP_PORT || 3000;

(async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`[INFO] Server is running on port ${PORT}`);
  });
})();
