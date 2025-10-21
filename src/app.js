import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
const pool = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "senai",
  database: "senai",
});

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Olá Mundo");
});

// USUARIOS
app.get("/usuarios", async (req, res) => {
  const [results] = await pool.query("SELECT * FROM usuario");
  res.send(results);
});

app.get("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const [results] = await pool.query(
    "SELECT * FROM usuario WHERE idusuario=?",
    id
  );
  res.send(results);
});

app.post("/usuarios", async (req, res) => {
  try {
    const { body } = req;
    const [results] = await pool.query(
      "INSERT INTO usuario (nome,idade) VALUES (?,?)",
      [body.nome, body.idade]
    );

    const [usuarioCriado] = await pool.query(
      "Select * from usuario WHERE idusuario=?",
      results.insertId
    );

    return res.status(201).json(usuarioCriado);
  } catch (error) {
    console.log(error);
  }
});

app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await pool.query(
      "DELETE FROM usuario WHERE idusuario=?",
      id
    );
    res.status(200).send("Usuário deletado!", results);
  } catch (error) {
    console.log(error);
  }
});

app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;
    const [results] = await pool.query(
      "UPDATE usuario SET `nome` = ?, `idade` = ? WHERE idusuario = ?; ",
      [body.nome, body.idade, id]
    );
    res.status(200).send("Usuario atualizado", results);
  } catch (error) {
    console.log(error);
  }
});

// REGISTRO E LOGIN
app.post("/registrar", async (req, res) => {
  try {
    const { body } = req;
    const [results] = await pool.query(
      "INSERT INTO usuario (nome,idade, email, senha) VALUES (?,?,?,?)",
      [body.nome, body.idade, body.email, body.senha]
    );

    const [usuarioCriado] = await pool.query(
      "Select * FROM usuario WHERE id'=?",
      results.insertId
    );

    return res.status(201).json(usuarioCriado);
  } catch (error) {
    console.log(error);
  }
});

/* LOGIN */
app.post("/login", async (req, res) => {
  try {
    const { body } = req;

    const [usuario] = await pool.query(
      "Select * from usuario WHERE email=? and senha=?",
      [body.email, body.senha]
    );

    if (usuario.length > 0) {
      return res.status(200).json({
        message: "Usuario logado",
        dados: usuario,
      });
    } else {
      return res.status(404).send("Email ou senha errados!");
    }
  } catch (error) {
    console.log(error);
  }
});

// LOGS
app.get("/logs", async (req, res) => {
  const { query } = req;
  const pagina = Number(query.pagina) - 1;
  const quantidade = Number(query.quantidade);
  const offset = pagina * quantidade;
  try {
    const [results] = await pool.query(
      `SELECT 
      log.id,
      log.categoria,
      log.horas_trabalhadas,
      log.linhas_codigo,
      log.bugs_corrigidos,
      (SELECT COUNT (*)
      FROM
        senai.like
        WHERE senai.like.log_id = lgs.id) as likes,
      (SELECT COUNT(*)
      FROM senai.comment
      WHERE senai.comment.log_id = lgs.id) as qnt_comments  
      FROM
      senai.lgs
        ORDER BY 
          senai.log.id asc 
        LIMIT ? 
        OFFSET ?
        ; `,
      [quantidade, offset]
    );
    res.send(results);
  } catch (error) {
    res.status(500).send({ error: 'Erro ao buscar logs', details: error.message });
  }
});


app.post("/logs", async (req, res) => {
  try {
    const { body } = req;
    const [results] = await pool.query(
      "INSERT INTO lgs(id_user ,categoria, horas_trabalhadas, linhas_codigo, bugs_corrigidos) VALUES (?, ?, ?, ?, ?)",
      [
        body.id_user,
        body.categoria,
        body.horas_trabalhadas,
        body.linhas_codigo,
        body.bugs_corrigidos
      ]
    );
    const [logCriado] = await pool.query(
      "SELECT * FROM lgs WHERE id=?",
      results.insertId
    );
    res.status(201).json(logCriado);
  } catch (error) {
    console.log(error);
  }
});

app.post("/likes", async (req, res) => {
  try {
    const { body } = req;
    const [results] = await pool.query(
      "INSERT INTO like (log_id, user_id) VALUES (?, ?)",
      [
        body.log_id,
        body.user_id,
      ]
    );
    const [likeCriado] = await pool.query(
      "SELECT * FROM like WHERE id=?",
      results.insertId
    );
    res.status(201).json(likeCriado);
  } catch (error) {
    console.log(error);
  }
});


app.delete("/likes", async (req, res) => {
  try {
    const { log_id,user_id } = req.query;
    const [results] = await pool.query(
      "DELETE FROM `like` WHERE log_id = ? AND user_id = ? ",
     [ Number(log_id),
      Number(user_id)]
    );
    res.status(200).send("like removido!", results);
  } catch (error) {
    console.log(error);
  }
});





app.listen(3000, () => {
  console.log(`Servidor rodando na porta: 3000`);
});
