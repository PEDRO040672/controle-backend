const express = require('express');
const controller = require('../controllers/cadcid.controller');

const router = express.Router();

router.get('/', controller.listar);
router.get('/:cid_id', controller.buscarPorCid_id);
router.post('/', controller.criar);
router.put('/:cid_id', controller.atualizar);
router.delete('/:cid_id', controller.remover);

module.exports = router;
