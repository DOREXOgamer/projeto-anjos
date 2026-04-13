import { prisma } from './src/lib/db';
prisma.user.findMany().then(u => {
  console.log(JSON.stringify(u, null, 2));
  process.exit(0);
}).catch(console.error);
