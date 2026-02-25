const express = require('express');
const cors = require('cors');

const pessoasRoutes = require('./routes/pessoas.routes');

const app = express();

app.use(cors());
app.use(express.json());

// rota raiz
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

// rotas
app.use('/pessoas', pessoasRoutes);

module.exports = app;
