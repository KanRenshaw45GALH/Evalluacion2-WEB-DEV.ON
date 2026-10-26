const generarTemperatura = () => Math.floor(Math.random() * 100) + 1;
const MAX_INTENTOS = 3;
const TIEMPO_INTENTO_MS = 10_000;

const estadoReactor = {
  temperaturaSecreta: generarTemperatura(),
  intentos: 0,
  nombreJugador: "Jugador",
  estado: "jugando",
  fechaInicio: new Date().toISOString(),
  fechaLimite: Date.now() + TIEMPO_INTENTO_MS,
  historialIntentos: [],
  siguienteId: 1,
  partidas: [],
  temporizador: null
};

module.exports = {
  estadoReactor,
  generarTemperatura,
  MAX_INTENTOS,
  TIEMPO_INTENTO_MS
};
