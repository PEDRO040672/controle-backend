const express = require('express');
const controller = require('../controllers/cadtit.controller');

const router = express.Router();

router.get('/', controller.listar);
router.get('/:tit_id', controller.buscarPorTit_id);
router.post('/', controller.criar);
router.put('/:tit_id', controller.atualizar);
router.delete('/:tit_id', controller.remover);

module.exports = router;
