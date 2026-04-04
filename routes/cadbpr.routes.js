const express = require('express');
const router = express.Router();

const cadbprController = require('../controllers/cadbpr.controller');

// LISTAR BAIXAS DA PARCELA
router.get('/:tr/:pc', cadbprController.listar);

// INSERIR BAIXA
router.post('/', cadbprController.inserir);

// EXCLUIR BAIXA
router.delete('/:tr/:pc/:it', cadbprController.excluir);

module.exports = router;