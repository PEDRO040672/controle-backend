const express = require('express');
const controller = require('../controllers/cados.controller');

const router = express.Router();

router.get('/', controller.listar);
router.get('/:os_tr', controller.buscarPorOs_tr);
router.post('/', controller.criar);
router.put('/:os_tr', controller.atualizar);
router.delete('/:os_tr', controller.remover);

module.exports = router;
