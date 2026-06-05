import { initDatabase } from './server/init-db.js';

await initDatabase({ closePool: false });

await import('./server/server.js');