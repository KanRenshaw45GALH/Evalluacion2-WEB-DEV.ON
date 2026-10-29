
const MAX_INTENTOS = 3;
const TIEMPO_INTENTO_MS = 10_000;

// Genera una temperatura secreta entre 1 y 100.
function generarTemperatura() {
  return Math.floor(Math.random() * 100) + 1;
}

// Estado compartido de la partida actual e historial.
const estadoReactor = {
  temperaturaSecreta: generarTemperatura(),
  intentos: 0,
  nombreJugador: "Jugador",
  estado: "jugando",
  historialIntentos: [],
  partidas: [],
  siguienteId: 1,
  fechaInicio: new Date().toISOString(),
  fechaLimite: Date.now() + TIEMPO_INTENTO_MS,
  fechaFin: null,
  temporizador: null
};

module.exports = {
  estadoReactor,
  generarTemperatura,
  MAX_INTENTOS,
  TIEMPO_INTENTO_MS
};
