import { Router } from "express";
import { estado, buscarEquipo, estadoCarga } from "../estado.js";

const router = Router();
router.get("/", (req, res) => {
res.json(estadoCarga());
});

router.post("/agregar", (req, res) => {
const { equipoId, cantidad } = req.body;
const equipo = buscarEquipo(equipoId);

if (!equipo) {
    return res.status(404).json({ mensaje: "Suministro no encontrado" });
}
if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return res.status(400).json({ mensaje: "Cantidad inválida" });
}
if (equipo.stock < cantidad) {
    return res.status(400).json({ mensaje: "Stock en base insuficiente" });
}
if (equipo.precio * cantidad > estadoCarga().creditos) {
    return res.status(400).json({ mensaje: "Créditos insuficientes para esta cantidad" });
}


    equipo.stock -= cantidad;
    const existente = estado.itemsCargados.find((i) => i.id === equipoId);
    if (existente) {
existente.cantidad += cantidad;
} else {
estado.itemsCargados.push({ id: equipoId, cantidad });
}

res.status(201).json(estadoCarga());
});

router.put("/actualizar-unidades/:id", (req, res) => {
const id = Number(req.params.id);
const { cantidad } = req.body;
const item = estado.itemsCargados.find((i) => i.id === id);
const equipo = buscarEquipo(id);

if (!item || !equipo) {
    return res.status(404).json({ mensaje: "Ese suministro no está en la carga" });
}

if (!Number.isInteger(cantidad) || cantidad < 0) {
    return res.status(400).json({ mensaje: "Cantidad inválida" });
}
const diferencia = cantidad - item.cantidad; // positivo: sube, negativo: 
baja
if (diferencia > equipo.stock) {
    return res.status(400).json({ mensaje: "Stock en base insuficiente" });
}
if (diferencia * equipo.precio > estadoCarga().creditos) {
    return res.status(400).json({ mensaje: "Créditos insuficientes para esta cantidad" });}
equipo.stock -= diferencia; 
item.cantidad = cantidad;

if (item.cantidad === 0) {
estado.itemsCargados = estado.itemsCargados.filter((i) => i.id !== id);
}
res.json(estadoCarga());
});

router.delete("/eliminar/:id", (req, res) => {
const id = Number(req.params.id);
const item = estado.itemsCargados.find((i) => i.id === id);
if (!item) {
return res.status(404).json({ mensaje: "Ese suministro no está en la carga" });
}

res.json(estadoCarga());
});

buscarEquipo(id).stock += item.cantidad; 
estado.itemsCargados = estado.itemsCargados.filter((i) => i.id !== id);
export default router;