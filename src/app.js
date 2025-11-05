import express from "express"
import cors from "cors"
import mysql from "mysql2/promise"

const pool = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "senai",
  database: "senai"
})

const app = express()
app.use(express.json())
app.use(cors())

app.get("/", (req, res) => {
  res.send("Olá Mundo")
})

// USUARIOS
app.get("/usuarios", async (req, res) => {
  const { query } = req
  const pagina = Math.max(0, (Number(query.pagina) || 1) - 1)
  const quantidade = Math.max(1, Number(query.quantidade) || 10)
  const offset = pagina * quantidade

  try {
    const [usuarios] = await pool.query(
      `SELECT id, nome, idade, email, senha
       FROM usuario
       ORDER BY id ASC
       LIMIT ? OFFSET ?`,
      [quantidade, offset]
    )

    const [total] = await pool.query(`SELECT COUNT(*) AS total FROM usuario`)

    res.json({
      usuarios,
      total: total[0].total
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get("/usuarios/:id", async (req, res) => {
  const { id } = req.params
  const [results] = await pool.query("SELECT * FROM usuario WHERE id=?", [id])
  if (results.length === 0) {
    return res.status(404).json({ message: "Usuário não encontrado" })
  }
  res.json(results[0])
})

app.post("/usuarios", async (req, res) => {
  try {
    const { body } = req
    const [results] = await pool.query(
      "INSERT INTO usuario (nome,idade) VALUES (?,?)",
      [body.nome, body.idade]
    )

    const [usuarioCriado] = await pool.query(
      "Select * from usuario WHERE id=?",
      results.insertId
    )

    return res.status(201).json(usuarioCriado)
  } catch (error) {
    console.log(error)
  }
})

app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params
    const [results] = await pool.query(
      "DELETE FROM usuario WHERE id=?",
      id
    )
    res.status(200).send("Usuário deletado!", results)
  } catch (error) {
    console.log(error)
  }
})

app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { nome, idade, email, senha } = req.body
    const [results] = await pool.query(
      "UPDATE usuario SET `nome` = ?, `idade` = ?, `email` = ?, `senha` = ? WHERE id = ?",
      [nome, idade, email, senha, id]
    )
    res.status(200).send("Usuario atualizado", results)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Erro ao atualizar usuário" })
  }
})

// REGISTRO E LOGIN
app.post("/registrar", async (req, res) => {
  try {
    const { nome, idade, email, senha } = req.body;

    const [results] = await pool.query(
      "INSERT INTO usuario (nome, idade, email, senha) VALUES (?, ?, ?, ?)",
      [nome, idade, email, senha]
    );

    const [usuarioCriado] = await pool.query(
      "SELECT * FROM usuario WHERE id = ?",
      [results.insertId]
    );

    return res.status(201).json(usuarioCriado[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "E-mail já cadastrado!" });
    }

    console.error("Erro no cadastro:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
});
app.post("/login", async (req, res) => {
  try {
    const { body } = req
    const [usuario] = await pool.query(
      "Select * from usuario WHERE email=? and senha=?",
      [body.email, body.senha]
    )

    if (usuario.length > 0) {
      return res.status(200).json({
        message: "Usuario logado",
        dados: usuario
      })
    } else {
      return res.status(404).send("Email ou senha errados!")
    }
  } catch (error) {
    console.log(error)
  }
})

// LOGS
app.get("/logs", async (req, res) => {
  const { query } = req;
  const pagina = Math.max(0, (Number(query.pagina) || 1) - 1);
  const quantidade = Math.max(1, Number(query.quantidade) || 10);
  const offset = pagina * quantidade;

  try {
    const [logs] = await pool.query(
      `SELECT 
        lgs.id,
        lgs.titulo,
        lgs.descricao,
        lgs.categoria,
        lgs.horas_trabalhadas,
        lgs.linhas_codigo,
        lgs.bugs_corrigidos,
        lgs.id_user,
        usuario.nome,
        (SELECT COUNT(*) FROM senai.like WHERE senai.like.log_id = lgs.id) AS likes,
        (SELECT COUNT(*) FROM senai.comment WHERE senai.comment.id_log = lgs.id) AS qnt_comments
      FROM senai.lgs
      JOIN senai.usuario ON usuario.id = lgs.id_user
      ORDER BY lgs.id ASC
      LIMIT ? OFFSET ?`,
      [quantidade, offset]
    );

    const [totalRows] = await pool.query(`SELECT COUNT(*) AS total FROM senai.lgs`);

    res.json({
      logs,
      total: totalRows[0].total
    });
  } catch (error) {
    console.error("Erro ao buscar logs:", error);
    res.status(500).json({ error: "Erro ao buscar logs", details: error.message });
  }
});
app.post("/logs", async (req, res) => {
  try {
    const { body } = req;

    const [results] = await pool.query(
      `INSERT INTO lgs 
      (id_user, titulo, descricao, categoria, horas_trabalhadas, linhas_codigo, bugs_corrigidos) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        body.id_user,
        body.titulo,
        body.descricao,
        body.categoria,
        body.horas_trabalhadas,
        body.linhas_codigo,
        body.bugs_corrigidos
      ]
    );

    const [logCriado] = await pool.query(
      `SELECT 
        lgs.id,
        lgs.titulo,
        lgs.descricao,
        lgs.categoria,
        lgs.horas_trabalhadas,
        lgs.linhas_codigo,
        lgs.bugs_corrigidos,
        lgs.id_user,
        usuario.nome,
        (SELECT COUNT(*) FROM senai.like WHERE senai.like.log_id = lgs.id) AS likes,
        (SELECT COUNT(*) FROM senai.comment WHERE senai.comment.id_log = lgs.id) AS qnt_comments
      FROM senai.lgs
      JOIN senai.usuario ON usuario.id = lgs.id_user
      WHERE lgs.id = ?`,
      [results.insertId]
    );

    res.status(201).json(logCriado);
  } catch (error) {
    console.error("Erro ao criar log:", error);
    res.status(500).json({ error: "Erro ao criar log", details: error.message });
  }
});

app.get("/logs/horas_trabalhadas/:id", async (req, res) => {
  const { id } = req.params
  const { query } = req

  const pagina = Math.max(0, (Number(query.pagina) || 1) - 1)
  const quantidade = Math.max(1, Number(query.quantidade) || 10)
  const offset = pagina * quantidade

  try {
    const [results] = await pool.query(
      `SELECT 
          lgs.id,
          lgs.horas_trabalhadas
       FROM senai.lgs AS lgs
       WHERE lgs.id_user = ?
       ORDER BY lgs.id ASC
       LIMIT ? OFFSET ?`,
      [id, quantidade, offset]
    )

    res.send(results)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erro ao buscar horas trabalhadas do usuário" })
  }
})
app.get("/logs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [log] = await pool.query(`
      SELECT 
        lgs.id,
        lgs.titulo,
        lgs.descricao,
        lgs.categoria,
        lgs.horas_trabalhadas,
        lgs.linhas_codigo,
        lgs.bugs_corrigidos,
        lgs.id_user,
        usuario.nome,
        (SELECT COUNT(*) FROM senai.like WHERE senai.like.log_id = lgs.id) AS likes,
        (SELECT COUNT(*) FROM senai.comment WHERE senai.comment.id_log = lgs.id) AS qnt_comments
      FROM senai.lgs
      JOIN senai.usuario ON usuario.id = lgs.id_user
      WHERE lgs.id = ?
      LIMIT 1
    `, [id]);

    if (log.length === 0) {
      return res.status(404).json({ message: "Log não encontrado" });
    }

    res.json(log[0]); 
    
  } catch (error) {
    console.error("Erro ao buscar log:", error);
    res.status(500).json({ error: "Erro ao buscar log" });
  }
});

app.get("/logs/bugs/:id", async (req, res) => {
  const { id } = req.params
  const { query } = req

  const pagina = Math.max(0, (Number(query.pagina) || 1) - 1)
  const quantidade = Math.max(1, Number(query.quantidade) || 10)
  const offset = pagina * quantidade

  try {
    const [results] = await pool.query(
      `SELECT 
        lgs.id,
        id_user,
        bugs_corrigidos
        FROM senai.lgs AS lgs
      WHERE lgs.id_user = ?
      ORDER BY lgs.id ASC
      LIMIT ? OFFSET ?`,
      [id, quantidade, offset]
    )
    res.send(results)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erro ao buscar bugs_corrigidos do usuário" })
  }
})

app.get("/logs/usuariosfull/:id", async (req, res) => {
  const { id } = req.params
  const { query } = req

  const pagina = Math.max(0, (Number(query.pagina) || 1) - 1)
  const quantidade = Math.max(1, Number(query.quantidade) || 10)
  const offset = pagina * quantidade

  try {
    const [results] = await pool.query(
      `SELECT 
        lgs.id,
        id_user,
        bugs_corrigidos,
        horas_trabalhadas
        FROM senai.lgs AS lgs
      WHERE lgs.id_user = ?
      ORDER BY lgs.id ASC
      LIMIT ? OFFSET ?`,
      [id, quantidade, offset]
    )
    res.send(results)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erro ao buscar bugs_corrigidos do usuário" })
  }
})

app.post("/likes", async (req, res) => {
  try {
    const { log_id, user_id } = req.body

    const [results] = await pool.query(
      "INSERT INTO `like` (log_id, user_id) VALUES (?, ?)",
      [log_id, user_id]
    )

    res.status(201).json({ message: "Like adicionado com sucesso!" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erro ao adicionar like", details: error.message })
  }
})

app.delete("/likes", async (req, res) => {
  try {
    const { log_id, user_id } = req.query

    const [results] = await pool.query(
      "DELETE FROM `like` WHERE log_id = ? AND user_id = ?",
      [Number(log_id), Number(user_id)]
    )
    res.status(200).json({ message: "Like removido com sucesso!" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erro ao remover like", details: error.message })
  }
})

app.listen(3000, () => {
  console.log(`Servidor rodando na porta: 3000`)
})
