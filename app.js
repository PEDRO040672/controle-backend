const express = require('express');
const cors = require('cors');

const cadcidRoutes = require('./routes/cadcid.routes');
const cadtitRoutes = require('./routes/cadtit.routes');
const cadcidRoutes = require('./routes/cadeqp.routes');

const app = express();

app.use(cors());
app.use(express.json());

// rota raiz
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

// rotas
app.use('/cadcid', cadcidRoutes);
app.use('/cadtit', cadtitRoutes);
app.use('/cadeqp', cadtitRoutes);

module.exports = app;
