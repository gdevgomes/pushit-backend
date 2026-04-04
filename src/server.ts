import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import { app } from './app';

const PORT = Number(process.env.PORT) || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send({ message: 'Backend running ok' }).status(200);
  res.end();
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
