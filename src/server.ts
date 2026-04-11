import dotenv from 'dotenv';
dotenv.config();

import { validateEnv, env } from './config/env';
validateEnv();

import { Request, Response } from 'express';
import { app } from './app';

const PORT = env.port;

app.get('/', (req: Request, res: Response) => {
  res.send({ message: 'Backend running ok' }).status(200);
  res.end();
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
