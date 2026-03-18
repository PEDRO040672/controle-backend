const express = require('express');
const controller = require('../controllers/cadeqp.controller');
const router = express.Router();

router.get('/', controller.listar);
router.get('/:eqp_id', controller.buscarPorEqp_id);
router.post('/', controller.criar);
router.put('/:eqp_id', controller.atualizar);
router.delete('/:eqp_id', controller.remover);

module.exports = router;
