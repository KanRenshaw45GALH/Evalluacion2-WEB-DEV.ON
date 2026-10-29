import { estado, DURACION_SESION_MS, reiniciarSesion } from "../estado.js";

export const verificarSesion = (req, res, next) => {
if (Date.now() - estado.inicioSesion > DURACION_SESION_MS) {
reiniciarSesion();
return res.status(410).json({
mensaje: "La ventana de lanzamiento se cerró. Inicia la misión nuevamente.",
sesionExpirada: true,
});

}
next();
};