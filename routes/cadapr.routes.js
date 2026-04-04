const express = require('express');
const router = express.Router();

const cadaprController = require('../controllers/cadapr.controller');

// LISTAR
router.get('/', cadaprController.listar);

// BUSCAR POR TR
router.get('/:tr', cadaprController.buscar);

// SALVAR (INSERT / UPDATE)
router.post('/', cadaprController.salvar);

// EXCLUIR
router.delete('/:tr', cadaprController.excluir);

module.exports = router;
