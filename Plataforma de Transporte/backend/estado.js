export const PRESUPUESTO = 500;
export const DURACION_SESION_MS = 5 * 60 * 1000; // 5 minutos

const inventarioInicial = [
{ id: 201, nombre: "Tanque de Oxígeno XL", precio: 50.0, stock: 5, 
categoria: "Soporte Vital" },
{ id: 202, nombre: "Ración Liofilizada", precio: 15.0, stock: 20, 
categoria: "Alimentos" },
{ id: 203, nombre: "Panel Solar Plegable", precio: 120.0, stock: 3, 
categoria: "Energía" },
{ id: 204, nombre: "Kit Médico Orbital", precio: 80.0, stock: 4, categoria: 
"Soporte Vital" },
{ id: 205, nombre: "Filtro de Agua", precio: 35.0, stock: 6, categoria: 
"Soporte Vital" },
{ id: 206, nombre: "Traje EVA", precio: 200.0, stock: 2, categoria: 
"Equipo" },
];

export const estado = {
inventario: structuredClone(inventarioInicial),
itemsCargados: [],
inicioSesion: Date.now(),
};

export const reiniciarSesion = () => {
estado.inventario = structuredClone(inventarioInicial);
estado.itemsCargados = [];
estado.inicioSesion = Date.now();
};

export const buscarEquipo = (id) => estado.inventario.find((e) => e.id === 
id);
export const calcularTotal = () =>
estado.itemsCargados.reduce((acumulado, item) => {
return acumulado + buscarEquipo(item.id).precio * item.cantidad;
}, 0);

export const estadoCarga = () => {
const total = calcularTotal();
const segundosPasados = Math.floor((Date.now() - estado.inicioSesion) / 
1000);

return {
creditos: PRESUPUESTO - total,
itemsCargados: estado.itemsCargados,
total,
tiempoRestante: Math.max(DURACION_SESION_MS / 1000 - segundosPasados, 0),
};

};