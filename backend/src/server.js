import express from 'express';
import conveniosRouter from './routes/convenios.js';
import pacientesRouter from './routes/pacientes.js';
import atendimentosRouter from './routes/atendimentos.js';

const app = express();
app.use(express.json());

app.use('/convenios', conveniosRouter);
app.use('/pacientes', pacientesRouter);
app.use('/atendimentos', atendimentosRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API da clínica rodando na porta ${port}`);
});
