const express = require('express');
const controller = require('../controllers/cadope.controller');
const router = express.Router();

router.get('/', controller.listar);
router.get('/:ope_id', controller.buscarPorOpe_id);
router.post('/', controller.criar);
router.put('/:ope_id', controller.atualizar);
router.delete('/:ope_id', controller.remover);

module.exports = router;