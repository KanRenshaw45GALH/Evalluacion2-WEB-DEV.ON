const express = require("express");
const cors = require("cors");
const reactorRoutes = require("./routes/reactor");
const partidasRoutes = require("./routes/partidas");
const app = express();
const PORT = 3000;

// Permite recibir solicitudes desde el frontend.
app.use(cors());
// Permite leer cuerpos de solicitudes en formato JSON.
app.use(express.json());
// Ruta de comprobación del servidor.
app.get("/", (req, res) => {
  res.json({
    mensaje: "Servidor Estabiliza el Reactor operativo."
  });
});

// Endpoints principales exigidos en la evaluación.
app.use("/", reactorRoutes);
// Endpoints adicionales del historial.
app.use("/api/partidas", partidasRoutes);
// Manejo de rutas inexistentes.
app.use((req, res) => {
  res.status(404).json({
    mensaje: "Endpoint no encontrado."
  });
});

app.listen(PORT, () => {
  console.log(
    `Servidor Estabiliza el Reactor en http://localhost:${PORT}`
  );
});
