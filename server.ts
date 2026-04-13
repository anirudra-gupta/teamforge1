import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

// Catch process errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    console.log("Starting TeamForge Server...");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("CWD:", process.cwd());
    console.log("GEMINI_API_KEY present:", !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"));

    const app = express();
    const PORT = 3000;

    app.use(express.json());

    // Request logger
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });

    // AI Services Import
    const aiServices = await import("./src/services/gemini.server.ts");

    // Health & Test Routes (Both prefixes)
    const healthHandler = (req: any, res: any) => {
      res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        version: "1.1.0",
        env: process.env.NODE_ENV,
        aiReady: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY")
      });
    };

    app.get("/api/health", healthHandler);
    app.get("/backend/health", healthHandler);
    app.get("/api/test", healthHandler);
    app.get("/backend/test", healthHandler);

    app.get("/api/ping", (req, res) => res.send("pong"));
    app.get("/backend/ping", (req, res) => res.send("pong"));

    // AI Routes (Both prefixes)
    const aiRoutes = [
      { path: "/ai/generate-profile", method: "post", handler: aiServices.serverGenerateUserProfile, key: "answers" },
      { path: "/ai/validate-idea", method: "post", handler: aiServices.serverValidateIdea, key: "idea" },
      { path: "/ai/validate-idea-detailed", method: "post", handler: aiServices.serverValidateIdeaDetailed, keys: ["description", "targetAudience", "revenueModel", "geography"] },
      { path: "/ai/rank-matches", method: "post", handler: aiServices.serverRankCoFounderMatches, keys: ["userProfile", "otherProfiles"] },
      { path: "/ai/chat", method: "post", handler: aiServices.serverChatWithLearningAssistant, keys: ["messages", "userContext"] }
    ];

    aiRoutes.forEach(route => {
      const fullHandler = async (req: any, res: any) => {
        try {
          let result;
          if (route.key) {
            result = await (route.handler as any)(req.body[route.key]);
          } else if (route.keys) {
            const args = route.keys.map(k => req.body[k]);
            result = await (route.handler as any)(...args);
          }
          
          if (route.path === "/ai/chat") {
            res.json({ text: result });
          } else {
            res.json(result);
          }
        } catch (error: any) {
          console.error(`AI Error (${route.path}):`, error);
          res.status(500).json({ error: error.message });
        }
      };

      app.post(`/api${route.path}`, fullHandler);
      app.post(`/backend${route.path}`, fullHandler);
    });

    // Catch-all for unhandled API routes
    app.all(["/api/*", "/backend/*"], (req, res) => {
      console.log("Unhandled API request:", req.method, req.url);
      res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      console.log("Initializing Vite middleware...");
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false // Disable HMR to avoid port conflicts
        },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware initialized.");
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("CRITICAL SERVER STARTUP ERROR:", err);
    process.exit(1);
  }
}

startServer();
