const pool = require('../db/pool');

//==============================================================
// LISTAR BAIXAS DA PARCELA
exports.listar = async (req, res) => {

  const { tr, pc } = req.params;

  try {

    const result = await pool.query(
      `SELECT *
       FROM cadbpr
       WHERE bpr_tr = $1
       AND bpr_pc = $2
       ORDER BY bpr_it`,
      [tr, pc]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: error.message });
  }
};

//==============================================================
// INSERIR BAIXA
exports.inserir = async (req, res) => {

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const {
      bpr_tr,
      bpr_pc,
      bpr_dtb,
      bpr_obs,
      bpr_vlb
    } = req.body;

    //==========================================================
    // PRÓXIMO ITEM
    const it = await client.query(
      `SELECT COALESCE(MAX(bpr_it),0) + 1 AS prox
       FROM cadbpr
       WHERE bpr_tr = $1
       AND bpr_pc = $2`,
      [bpr_tr, bpr_pc]
    );

    const bpr_it = it.rows[0].prox;

    //==========================================================
    // INSERT
    await client.query(
      `INSERT INTO cadbpr (
        bpr_tr,
        bpr_pc,
        bpr_it,
        bpr_dtb,
        bpr_obs,
        bpr_vlb
      )
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        bpr_tr,
        bpr_pc,
        bpr_it,
        bpr_dtb,
        bpr_obs,
        bpr_vlb
      ]
    );

    await client.query('COMMIT');

    res.json({ ok: true });

  } catch (error) {

    await client.query('ROLLBACK');

    console.error(error);
    res.status(500).json({ erro: error.message });

  } finally {
    client.release();
  }
};

//==============================================================
// EXCLUIR BAIXA
exports.excluir = async (req, res) => {

  const { tr, pc, it } = req.params;

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    await client.query(
      `DELETE FROM cadbpr
       WHERE bpr_tr = $1
       AND bpr_pc = $2
       AND bpr_it = $3`,
      [tr, pc, it]
    );

    await client.query('COMMIT');

    res.json({ ok: true });

  } catch (error) {

    await client.query('ROLLBACK');

    console.error(error);
    res.status(500).json({ erro: error.message });

  } finally {
    client.release();
  }
};