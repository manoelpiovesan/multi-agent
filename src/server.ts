import 'dotenv/config';
import {createServer} from "http";
import {initDb} from "./config/sequelize";
import app from "./app";
import {WsChatService} from "./services/ws_chat.service";


const PORT = process.env.APP_PORT || 3000;

(async () => {
  await initDb();

  const server = createServer(app);
  WsChatService.initialize(server);

  server.listen(PORT, () => {
    console.log(`[INFO] Server is running on port ${PORT}`);
  });
})();
