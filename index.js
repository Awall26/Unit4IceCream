const pg = require("pg");
const express = require("express");
const morgan = require("morgan");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://postgres@localhost/acme_icecream_db"
);
const server = express();

const init = async () => {
  await client.connect();
  console.log("connected to database");
  let SQL = `
    DROP TABLE IF EXISTS icecream;
    CREATE TABLE icecream(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    );
    `;
  await client.query(SQL);
  console.log("tables created");
  SQL = `
    INSERT INTO icecream(name, is_favorite) VALUES('Chocolate', false);
    INSERT INTO icecream(name, is_favorite) VALUES('Vanilla', false);
    INSERT INTO icecream(name, is_favorite) VALUES('Cookies & Cream', true);
    INSERT INTO icecream(name, is_favorite) VALUES('Cookie Dough', false);
    INSERT INTO icecream(name, is_favorite) VALUES('Strawberry', false);
    INSERT INTO icecream(name, is_favorite) VALUES('Mint Chocolate Chip', false);
    INSERT INTO icecream(name, is_favorite) VALUES('Moose Tracks', false);
    `;
  await client.query(SQL);
  console.log("data seeded");

  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server listening on port ${port}`));
};

init();

server.use(express.json());
server.use(morgan("dev"));

server.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM icecream ORDER BY created_at DESC;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
server.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM icecream WHERE id=$1;`;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
server.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `INSERT INTO icecream(name) VALUES($1) RETURNING *;`;
    const response = await client.query(SQL, [req.body.name]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
server.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `UPDATE icecream SET name=$1, is_favorite=$2, updated_at=now() WHERE id=$3 RETURNING *;`;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
server.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM icecream WHERE id=$1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});
