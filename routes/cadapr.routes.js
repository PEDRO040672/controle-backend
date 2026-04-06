const express = require('express');
const controller = require('../controllers/cadapr.controller');

const router = express.Router();

router.get('/', controller.listar);
router.get('/:apr_tr', controller.buscarPorApr_tr);
router.post('/', controller.criar);
router.put('/:apr_tr', controller.atualizar);
router.delete('/:apr_tr', controller.remover);

module.exports = router;