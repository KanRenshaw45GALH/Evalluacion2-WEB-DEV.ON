import express from "express";
import cors from "cors";
import { verificarSesion } from "./middlewares/verificarSesion.js";
import inventarioRoutes from "./routes/inventario.js";
import cargaRoutes from "./routes/carga.js";
const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());
app.use("/api", verificarSesion);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/carga", cargaRoutes);
app.listen(PORT, () => {
console.log(`Servidor AstroLogistics en http://localhost:${PORT}`);
});