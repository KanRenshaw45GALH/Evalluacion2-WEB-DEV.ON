// ============================================================
// services/api.js
// Único archivo que "habla" con el backend. Los componentes
// nunca usan fetch directamente: solo llaman a estas funciones.
//
// VITE_USE_MOCK=true  -> usa datos simulados (no necesita backend)
// VITE_USE_MOCK=false -> usa el backend real de tu compañero
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// ------------------------------------------------------------
// MODO REAL: llamadas fetch (promesas con async/await)
// ------------------------------------------------------------
const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    // "no-store": el navegador nunca reutiliza una respuesta guardada.
    // Sin esto, un 410 (sesión expirada) puede quedar en caché y repetirse.
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null; // la respuesta no traía JSON
  }

  // fetch NO lanza error con un 400, por eso lo lanzamos nosotros
  // para que el catch de React reciba el mensaje del backend.
  if (!response.ok) {
    // El backend responde los errores con el campo "mensaje"
    const mensaje =
      data?.mensaje || data?.message || data?.error || "Error en la petición";
    const error = new Error(mensaje);
    // El middleware verificarSesion responde 410 + sesionExpirada: true
    error.sesionExpirada = response.status === 410 || data?.sesionExpirada === true;
    throw error;
  }
  return data;
};

const realApi = {
  obtenerInventario: () => request("/api/inventario"),
  obtenerCarga: () => request("/api/carga"),
  agregarSuministro: (equipoId, cantidad) =>
    request("/api/carga/agregar", {
      method: "POST",
      body: JSON.stringify({ equipoId, cantidad }),
    }),
  actualizarUnidades: (id, cantidad) =>
    request(`/api/carga/actualizar-unidades/${id}`, {
      method: "PUT",
      body: JSON.stringify({ cantidad }),
    }),
  eliminarSuministro: (id) =>
    request(`/api/carga/eliminar/${id}`, { method: "DELETE" }),
  // No hace falta endpoint: el middleware verificarSesion del backend
  // reinicia la sesión solo, al responder el 410 de sesión expirada.
  reiniciarSesion: async () => {},
};

// ------------------------------------------------------------
// MODO SIMULADO: imita las reglas del backend en memoria
// ------------------------------------------------------------
const CREDITOS_INICIALES = 500;

const crearInventario = () => [
  { id: 201, nombre: "Tanque de Oxígeno XL", precio: 50, stock: 5, categoria: "Soporte Vital" },
  { id: 202, nombre: "Panel Solar Plegable", precio: 120, stock: 3, categoria: "Energía" },
  { id: 203, nombre: "Ración Liofilizada (caja)", precio: 15, stock: 20, categoria: "Alimentos" },
  { id: 204, nombre: "Kit Médico Orbital", precio: 80, stock: 4, categoria: "Medicina" },
  { id: 205, nombre: "Traje EVA Estándar", precio: 300, stock: 0, categoria: "Equipo" },
  { id: 206, nombre: "Filtro de Agua Compacto", precio: 40, stock: 8, categoria: "Soporte Vital" },
];

let inventarioMock = crearInventario();
let cargaMock = { creditos: CREDITOS_INICIALES, itemsCargados: [] };

const esperar = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));
const rechazar = (mensaje) => Promise.reject(new Error(mensaje));

const calcularTotal = () =>
  cargaMock.itemsCargados.reduce((acumulado, item) => {
    const producto = inventarioMock.find((p) => p.id === item.id);
    return acumulado + producto.precio * item.cantidad;
  }, 0);

const copiar = (objeto) => JSON.parse(JSON.stringify(objeto));

const mockApi = {
  obtenerInventario: async () => {
    await esperar();
    return copiar(inventarioMock);
  },

  obtenerCarga: async () => {
    await esperar();
    return { ...copiar(cargaMock), total: calcularTotal() };
  },

  agregarSuministro: async (equipoId, cantidad) => {
    await esperar();
    const producto = inventarioMock.find((p) => p.id === equipoId);
    if (!producto) return rechazar("Suministro no encontrado");
    if (producto.stock < cantidad) return rechazar("Stock en base insuficiente");
    if (producto.precio * cantidad > cargaMock.creditos)
      return rechazar("Créditos insuficientes para esta cantidad");

    producto.stock -= cantidad;
    cargaMock.creditos -= producto.precio * cantidad;
    const existente = cargaMock.itemsCargados.find((i) => i.id === equipoId);
    if (existente) existente.cantidad += cantidad;
    else cargaMock.itemsCargados.push({ id: equipoId, cantidad });
    return { ok: true };
  },

  actualizarUnidades: async (id, nuevaCantidad) => {
    await esperar();
    const item = cargaMock.itemsCargados.find((i) => i.id === id);
    const producto = inventarioMock.find((p) => p.id === id);
    if (!item || !producto) return rechazar("Ese suministro no está en la carga");

    const diferencia = nuevaCantidad - item.cantidad;
    if (diferencia > 0) {
      if (producto.stock < diferencia) return rechazar("Stock en base insuficiente");
      if (producto.precio * diferencia > cargaMock.creditos)
        return rechazar("Créditos insuficientes para esta cantidad");
    }

    producto.stock -= diferencia;
    cargaMock.creditos -= producto.precio * diferencia;
    if (nuevaCantidad <= 0) {
      cargaMock.itemsCargados = cargaMock.itemsCargados.filter((i) => i.id !== id);
    } else {
      item.cantidad = nuevaCantidad;
    }
    return { ok: true };
  },

  eliminarSuministro: async (id) => {
    await esperar();
    const item = cargaMock.itemsCargados.find((i) => i.id === id);
    const producto = inventarioMock.find((p) => p.id === id);
    if (!item || !producto) return rechazar("Ese suministro no está en la carga");

    producto.stock += item.cantidad;
    cargaMock.creditos += producto.precio * item.cantidad;
    cargaMock.itemsCargados = cargaMock.itemsCargados.filter((i) => i.id !== id);
    return { ok: true };
  },

  reiniciarSesion: async () => {
    await esperar(200);
    inventarioMock = crearInventario();
    cargaMock = { creditos: CREDITOS_INICIALES, itemsCargados: [] };
  },
};

const api = USE_MOCK ? mockApi : realApi;

export const {
  obtenerInventario,
  obtenerCarga,
  agregarSuministro,
  actualizarUnidades,
  eliminarSuministro,
  reiniciarSesion,
} = api;