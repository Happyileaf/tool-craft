import { serve } from '@hono/node-server';
import app from './lib/app.js';

const port = Number(process.env.PORT ?? 3001);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`API server listening on port ${info.port}`);
  },
);
