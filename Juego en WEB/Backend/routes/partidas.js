const express = require("express");
const router = express.Router();
const { estadoReactor } = require("../estado");

// GET /api/partidas
// Devuelve todas las partidas registradas.
router.get("/", (req, res) => {
  res.json(estadoReactor.partidas);
});

// GET /api/partidas/:id
// Devuelve una partida concreta.
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const partida = estadoReactor.partidas.find(
    (p) => p.id === id
  );

  if (!partida) {
    return res.status(404).json({
      mensaje: "Partida no encontrada."
    });
  }
  res.json(partida);
});

// PUT /api/partidas/:id
// Actualiza el nombre del jugador de una partida.
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { nombre } = req.body;
  if (
    typeof nombre !== "string" ||
    !nombre.trim() ||
    nombre.trim().length > 50
  ) {
    return res.status(400).json({
      mensaje: "El nombre debe tener entre 1 y 50 caracteres."
    });
  }

  const partida = estadoReactor.partidas.find(
    (p) => p.id === id
  );
  if (!partida) {
    return res.status(404).json({
      mensaje: "Partida no encontrada."
    });
  }

  partida.nombre = nombre.trim();
  res.json({
    mensaje: "Nombre actualizado correctamente.",
    partida
  });
});

// DELETE /api/partidas/:id
// Elimina una partida del historial.
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = estadoReactor.partidas.findIndex(
    (p) => p.id === id
  );
  if (indice === -1) {
    return res.status(404).json({
      mensaje: "Partida no encontrada."
    });
  }

  const eliminada = estadoReactor.partidas.splice(indice, 1)[0];
  res.json({
    mensaje: "Partida eliminada del historial.",
    partida: eliminada
  });
});

module.exports = router;
