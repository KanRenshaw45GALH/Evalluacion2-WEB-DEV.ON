const express = require("express");
const router = express.Router();
const {
  estadoReactor,
  generarTemperatura,
  MAX_INTENTOS,
  TIEMPO_INTENTO_MS
} = require("../estado");

// Detiene el temporizador que esté activo.
function cancelarTemporizador() {
  if (estadoReactor.temporizador !== null) {
    clearTimeout(estadoReactor.temporizador);
    estadoReactor.temporizador = null;
  }
}

// Guarda una partida finalizada en el historial general.
function finalizarPartida(resultado) {
  cancelarTemporizador();
  estadoReactor.estado = resultado;
  estadoReactor.fechaFin = new Date().toISOString();
  const partida = {
    id: estadoReactor.siguienteId++,
    nombre: estadoReactor.nombreJugador,
    temperaturaSecreta: estadoReactor.temperaturaSecreta,
    resultado,
    intentos: [...estadoReactor.historialIntentos],
    cantidadIntentos: estadoReactor.intentos,
    fechaInicio: estadoReactor.fechaInicio,
    fechaFin: estadoReactor.fechaFin
  };
  estadoReactor.partidas.push(partida);
  return partida;
}

// Programa automáticamente el vencimiento de un intento.
function iniciarTemporizador() {
  cancelarTemporizador();
  const limiteActual = estadoReactor.fechaLimite;
  estadoReactor.temporizador = setTimeout(() => {
    // Ignora temporizadores antiguos o partidas ya terminadas.
    if (
      estadoReactor.estado !== "jugando" ||
      estadoReactor.fechaLimite !== limiteActual
    ) {
      return;
    }
    estadoReactor.temporizador = null;
    estadoReactor.intentos++;
    estadoReactor.historialIntentos.push({
      numero: null,
      resultado: "Tiempo agotado",
      numeroIntento: estadoReactor.intentos
    });

    // Si se acabaron los intentos, registra la derrota.
    if (estadoReactor.intentos >= MAX_INTENTOS) {
      finalizarPartida("derrota");
      return;
    }

    // Comienza el plazo del siguiente intento.
    estadoReactor.fechaLimite =
      Date.now() + TIEMPO_INTENTO_MS;

    iniciarTemporizador();
  }, Math.max(0, limiteActual - Date.now()));
}

// POST /adjust
router.post("/adjust", (req, res) => {
  const { temperatura, nombre } = req.body;
  if (estadoReactor.estado !== "jugando") {
    return res.status(409).json({
      mensaje: "La partida terminó. Reinicia el reactor.",
      estado: estadoReactor.estado
    });
  }
  if (
    temperatura === undefined ||
    temperatura === null ||
    temperatura === "" ||
    !Number.isInteger(Number(temperatura)) ||
    Number(temperatura) < 1 ||
    Number(temperatura) > 100
  ) {
    return res.status(400).json({
      mensaje: "Ingresa un número entero entre 1 y 100."
    });
  }

  // El tiempo se comprueba antes de aceptar el intento.
  if (Date.now() >= estadoReactor.fechaLimite) {
    return res.status(409).json({
      mensaje: "El tiempo del intento ha terminado.",
      estado: estadoReactor.estado
    });
  }

  const numero = Number(temperatura);
  if (estadoReactor.intentos === 0 && nombre) {
    estadoReactor.nombreJugador =
      String(nombre).trim().slice(0, 50) || "Jugador";
  }

  // Cada envío válido consume un intento.
  cancelarTemporizador();
  estadoReactor.intentos++;
  let resultado;
  let mensaje;
  if (numero === estadoReactor.temperaturaSecreta) {
    resultado = "correcto";
    mensaje = "¡Reactor estabilizado!";
  } else if (numero < estadoReactor.temperaturaSecreta) {
    resultado = "mas_baja";
    mensaje = "La temperatura ideal es más alta.";
  } else {
    resultado = "mas_alta";
    mensaje = "La temperatura ideal es más baja.";
  }
  estadoReactor.historialIntentos.push({
    numero,
    resultado,
    numeroIntento: estadoReactor.intentos
  });

  if (resultado === "correcto") {
    const partida = finalizarPartida("victoria");
    return res.json({
      mensaje,
      estado: "victoria",
      intentosRestantes: MAX_INTENTOS - estadoReactor.intentos,
      partida
    });
  }

  if (estadoReactor.intentos >= MAX_INTENTOS) {
    const partida = finalizarPartida("derrota");
    return res.json({
      mensaje: "Intentos agotados. Reactor no estabilizado.",
      estado: "derrota",
      intentosRestantes: 0,
      partida
    });
  }

  // El siguiente intento recibe diez segundos nuevos.
  estadoReactor.fechaLimite =
    Date.now() + TIEMPO_INTENTO_MS;
  iniciarTemporizador();
  return res.json({
    mensaje,
    estado: "jugando",
    intentosRestantes: MAX_INTENTOS - estadoReactor.intentos,
    siguienteLimite: estadoReactor.fechaLimite,
    historialIntentos: estadoReactor.historialIntentos
  });
});

// POST /reboot
router.post("/reboot", (req, res) => {
  // Cancela el tiempo de la partida anterior.
  cancelarTemporizador();
  if (estadoReactor.estado === "jugando") {
    finalizarPartida("abandonada");
  }
  estadoReactor.temperaturaSecreta = generarTemperatura();
  estadoReactor.intentos = 0;
  estadoReactor.nombreJugador =
    typeof req.body.nombre === "string" && req.body.nombre.trim()
      ? req.body.nombre.trim().slice(0, 50)
      : "Jugador";
  estadoReactor.estado = "jugando";
  estadoReactor.fechaInicio = new Date().toISOString();
  estadoReactor.fechaLimite =
    Date.now() + TIEMPO_INTENTO_MS;
  estadoReactor.historialIntentos = [];
  delete estadoReactor.fechaFin;

  // Inicia el primer plazo automáticamente.
  iniciarTemporizador();
  res.json({
    mensaje: "Reactor reiniciado. ¡Comienza la misión!",
    estado: "jugando",
    maxIntentos: MAX_INTENTOS,
    tiempoPorIntento: TIEMPO_INTENTO_MS / 1000,
    intentosRestantes: MAX_INTENTOS,
    siguienteLimite: estadoReactor.fechaLimite
  });
});

router.get("/status", (req, res) => {
  const terminado = estadoReactor.estado !== "jugando";
  res.json({
    estado: estadoReactor.estado,
    nombre: estadoReactor.nombreJugador,
    intentos: estadoReactor.historialIntentos,
    intentosUsados: estadoReactor.intentos,
    intentosRestantes: Math.max(
      0,
      MAX_INTENTOS - estadoReactor.intentos
    ),
    tiempoRestante: terminado
      ? 0
      : Math.max(
          0,
          Math.ceil(
            (estadoReactor.fechaLimite - Date.now()) / 1000
          )
        ),
    fechaLimite: estadoReactor.fechaLimite,
    partida: terminado
      ? estadoReactor.partidas[
          estadoReactor.partidas.length - 1
        ] || null
      : null
  });
});

module.exports = router;
