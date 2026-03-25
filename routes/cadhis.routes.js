const express = require('express');
const controller = require('../controllers/cadhis.controller');
const router = express.Router();

router.get('/', controller.listar);
router.get('/:his_id', controller.buscarPorHis_id);
router.post('/', controller.criar);
router.put('/:his_id', controller.atualizar);
router.delete('/:his_id', controller.remover);

module.exports = router;
