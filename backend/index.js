import http from "node:http";
import "dotenv/config";
import app from "./src/index.js";

const PORT = process.env.PORT ?? 3000;
const server = http.createServer(app);

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀  Server running at http://localhost:${server.address().port}`);
});

const shutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully…`);
    server.close((err) => {
        if (err) {
            console.error("Error during shutdown:", err);
            process.exit(1);
        }
        console.log("Server closed. Exiting.");
        process.exit(0);
    });
};

process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
