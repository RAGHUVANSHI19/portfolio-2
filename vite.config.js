import { defineConfig, loadEnv } from 'vite';
import { handleChat } from './api/chat.js';

export default defineConfig(({ mode }) => {
  // Load environment variables (.env, .env.local)
  const env = loadEnv(mode, process.cwd(), '');
  // Populate process.env so handleChat can read GEMINI_API_KEY or OPENAI_API_KEY
  Object.assign(process.env, env);

  return {
    base: './',
    server: {
      port: 5173,
      host: true
    },
    plugins: [
      {
        name: 'api-chat-middleware',
        configureServer(server) {
          server.middlewares.use('/api/chat', async (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk;
              });

              req.on('end', async () => {
                try {
                  const parsed = JSON.parse(body || '{}');
                  const { messages } = parsed;

                  if (!messages || !Array.isArray(messages)) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Missing messages array in request body.' }));
                    return;
                  }

                  const result = await handleChat(messages);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                } catch (err) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ]
  };
});
