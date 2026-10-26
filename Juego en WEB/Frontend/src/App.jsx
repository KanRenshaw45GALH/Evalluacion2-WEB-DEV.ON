import { useCallback, useEffect, useState } from "react";
const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [nombre, setNombre] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [intentos, setIntentos] = useState([]);
  const [restantes, setRestantes] = useState(3);
  const [tiempo, setTiempo] = useState(10);
  const [limite, setLimite] = useState(null);
  const [estado, setEstado] = useState("cargando");
  const [mensaje, setMensaje] = useState("Conectando con el reactor...");
  const [partida, setPartida] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [historialGlobal, setHistorialGlobal] = useState([]);

 //Pantalla de inicio y pantalla de reglas del juego
  const [pantallaInicio, setpantallaInicio] = useState(true);
  const[reglasJuego, setreglasJuego] = useState(false);

  //Transicion de pantalla de inicio al juego
  const comenzarJuego = () => {
    setpantallaInicio(false);
    iniciarPartida();
  };

  // Iniciar o reiniciar una partida mediante Express.
  const iniciarPartida = useCallback(async () => {
    setCargando(true);

    try {
      const respuesta = await fetch(`${API}/reboot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim() || "Operador" })
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.mensaje || "No se pudo iniciar el reactor.");
      }

      setIntentos([]);
      setRestantes(data.maxIntentos);
      setTiempo(data.tiempoPorIntento);
      setLimite(data.siguienteLimite);
      setPartida(null);
      setEstado("jugando");
      setMensaje(data.mensaje);
      setTemperatura("");
    } catch (error) {
      setEstado("error");
      setMensaje(error.message || "No se pudo conectar con Express.");
    } finally {
      setCargando(false);
    }
  }, [nombre]);

  // Iniciar una partida al abrir la página.
  useEffect(() => {
    iniciarPartida();
    // Solo se ejecuta al montar el componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Consultar periódicamente el estado real del backend.
  useEffect(() => {
    if (estado !== "jugando") return;
    let activo = true;
    const consultarEstado = async () => {
      try {
        const respuesta = await fetch(`${API}/status`);
        if (!respuesta.ok) return;
        const data = await respuesta.json();
        if (!activo) return;
        setIntentos(data.intentos || []);
        setRestantes(data.intentosRestantes);
        setTiempo(data.tiempoRestante);
        setLimite(data.fechaLimite);
        if (data.estado === "victoria" || data.estado === "derrota") {
          setEstado(data.estado);
          setPartida(data.partida);
          setMensaje(
            data.estado === "victoria"
              ? "¡Reactor estabilizado correctamente!"
              : "El reactor no pudo estabilizarse."
          );
        }
      } catch (error) {
        console.error("Error consultando el reactor:", error);
      }
    };
    consultarEstado();
    const intervalo = setInterval(consultarEstado, 500);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, [estado]);

  // Mantener el contador visual sincronizado con la fecha límite.
  useEffect(() => {
    if (estado !== "jugando" || !limite) return;
    const actualizarTiempo = () => {
      setTiempo(
        Math.max(0, Math.ceil((limite - Date.now()) / 1000))
      );
    };
    actualizarTiempo();
    const intervalo = setInterval(actualizarTiempo, 100);
    return () => clearInterval(intervalo);
  }, [estado, limite]);

  
  // Consultar el historial global de partidas.
  useEffect(() => {
    let activo = true;
    async function cargarHistorialGlobal() {
      try {
        const respuesta = await fetch(`${API}/api/partidas`);
        if (!respuesta.ok) {
          throw new Error("No se pudo cargar el historial global.");
        }
        const partidas = await respuesta.json();
        if (activo && Array.isArray(partidas)) {
          // Mostrar primero las partidas más recientes.
          const ordenadas = [...partidas].sort((a, b) => {
            return new Date(b.fechaFin || b.fechaInicio || 0) -
                   new Date(a.fechaFin || a.fechaInicio || 0);
          });
          setHistorialGlobal(ordenadas);
        }
      } catch (error) {
        console.error("Error cargando el historial global:", error);
      }
    }
    cargarHistorialGlobal();

    // Actualizar el historial periódicamente.
    const intervalo = setInterval(cargarHistorialGlobal, 3000);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);


  // Enviar una temperatura al backend.
  async function enviarIntento(event) {
    event.preventDefault();
    if (estado !== "jugando" || cargando) return;
    const valor = Number(temperatura);
    if (
      temperatura.trim() === "" ||
      !Number.isInteger(valor) ||
      valor < 1 ||
      valor > 100
    ) {
      setMensaje("Introduce un número entero entre 1 y 100.");
      return;
    }
    setCargando(true);
    try {
      const respuesta = await fetch(`${API}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim() || "Operador",
          temperatura: valor
        })
      });

      const data = await respuesta.json();
      if (!respuesta.ok) {
        setMensaje(data.mensaje || "No se pudo procesar el intento.");
        return;
      }
      setMensaje(data.mensaje);
      setEstado(data.estado);
      setRestantes(data.intentosRestantes);
      if (data.historialIntentos) {
        setIntentos(data.historialIntentos);
      }
      if (data.partida) {
        setPartida(data.partida);
        setIntentos(data.partida.intentos);
      }
      if (data.siguienteLimite) {
        setLimite(data.siguienteLimite);
      }
      setTemperatura("");
    } catch (error) {
      setMensaje(error.message || "Error de comunicación con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  const terminado = estado === "victoria" || estado === "derrota";
  const ultimoIntento = intentos[intentos.length - 1];
  const claseTemperatura =
    ultimoIntento?.resultado === "mas_alta"
      ? "temperature-high"
      : ultimoIntento?.resultado === "mas_baja"
        ? "temperature-low"
        : ultimoIntento?.resultado === "correcto"
          ? "temperature-correct"
          : "";

  const progreso = Math.max(0, Math.min(100, tiempo * 10));

  // Pantalla de inicio y reglas del juego
if(pantallaInicio){
  return(
    <main className="reactor-page">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <section className="intro text-center my-5">
          <p className="eyebrow">SISTEMA DE CONTENCIÓN TÉRMICA</p>
          <h1>REACTOR<span> CORE</span></h1>
          <p className="lead my-3">
            Bienvenido, Operador. Debes calibrar la temperatura exacta del reactor antes de que ocurra una catástrofe.
          </p>

          <div className="my-4" style={{ maxWidth: "400px", margin: "0 auto" }}>
            <label htmlFor="nombreInicio">IDENTIFICACIÓN DEL OPERADOR:</label>
            <input
              id="nombreInicio"
              className="reactor-input my-2 text-center"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre o código"
              maxLength={50}
            />
          </div>

          <div className="d-flex justify-content-center gap-3 mt-4">
            <button className="primary-button" onClick={comenzarJuego}>
              🚀 INICIAR SECUENCIA DE ESTABILIZACIÓN
            </button>
            <button className="secondary-button" onClick={() => setReglasJuego(!reglasJuego)}>
              📜 {reglasJuego ? "OCULTAR REGLAS" : "MOSTRAR REGLAS DEL JUEGO"}
            </button>
          </div>
        </section>
        {reglasJuego && (
          <section className="panel my-4" style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h3>Reglas del juego</h3>
            <ul className="mt-3 text-start">
              <li>El núcleo genera una <strong>temperatura secreta entre 1 y 100 °C</strong>.</li>
              <li>Tienes un máximo de <strong>3 intentos</strong> para adivinar el número exacto.</li>
              <li>Cada intento tiene un tiempo límite de <strong>10 segundos</strong>.</li>
              <li>Si seleccionas un valor erróneo, la consola te guiará indicando si la temperatura ideal es <em>más alta</em> o <em>más baja</em>.</li>
              <li>Si se agotan los intentos o el tiempo llega a 0, <strong>¡EL REACTOR EXPLOTARÁ!</strong></li>
            </ul>
          </section>
        )}
      </main>
  );
}

  return (
    <main className="reactor-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand-mark">R</div>

        <div>
          <p className="eyebrow">CENTRO DE CONTROL · SECTOR 07</p>
          <h1>REACTOR<span> CORE</span></h1>
        </div>

        <div className={`system-status ${estado === "jugando" ? "online" : ""}`}>
          <span className="status-dot" />
          {estado === "jugando"
            ? "SISTEMA ACTIVO"
            : terminado
              ? "SESIÓN FINALIZADA"
              : estado === "error"
                ? "ERROR DE CONEXIÓN"
                : "CONECTANDO"}
        </div>
      </header>

      <section className="intro">
        <p className="eyebrow">PROTOCOLO DE ESTABILIZACIÓN</p>
        <h2>El núcleo depende de <span>ti.</span></h2>
        <p>
          Ajusta la temperatura ideal antes de que se agoten tus oportunidades.
        </p>
      </section>

      <section className="telemetry">
        <article className="metric-card">
          <span className="metric-icon orange">℃</span>
          <div>
            <p>TEMPERATURA DE ENTRADA</p>
            <strong>
              {temperatura || "--"}<small> °C</small>
            </strong>
          </div>
        </article>

        <article className="metric-card">
          <span className="metric-icon cyan">◷</span>
          <div>
            <p>TIEMPO RESTANTE</p>
            <strong className={tiempo <= 3 && estado === "jugando" ? "danger-text" : ""}>
              {estado === "jugando" ? tiempo : "--"}<small> s</small>
            </strong>
          </div>
        </article>

        <article className="metric-card">
          <span className="metric-icon purple">⌁</span>
          <div>
            <p>INTENTOS DISPONIBLES</p>
            <strong>{restantes}<small> / 3</small></strong>
          </div>
        </article>
      </section>

      <section className="game-layout">
        <article className="panel control-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">01 / CONTROL MANUAL</p>
              <h3>Ajuste térmico</h3>
            </div>
            <span className="panel-number">CORE-01</span>
          </div>

          <label htmlFor="nombre">IDENTIFICACIÓN DEL OPERADOR</label>
          <input
            id="nombre"
            className="reactor-input"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Escribe tu nombre"
            maxLength={50}
            disabled={estado === "jugando" && intentos.length > 0}
          />

          <form onSubmit={enviarIntento}>
            <label htmlFor="temperatura">TEMPERATURA OBJETIVO · 1–100</label>

            <div className="input-row">
              <input
                id="temperatura"
                className={`reactor-input temperature-input ${claseTemperatura}`}
                type="number"
                min="1"
                max="100"
                step="1"
                value={temperatura}
                onChange={(event) => setTemperatura(event.target.value)}
                placeholder="00"
                required
                disabled={estado !== "jugando" || cargando}
              />
              <span className="unit">°C</span>
            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={estado !== "jugando" || cargando}
            >
              {cargando ? "PROCESANDO..." : "↗ ESTABILIZAR REACTOR"}
            </button>
          </form>

          <div className="message-box" role="status">
            <span className="message-symbol">!</span>
            <div>
              <strong>MENSAJE DEL SISTEMA</strong>
              <p>{mensaje}</p>
            </div>
          </div>

          <button
            className="secondary-button"
            onClick={iniciarPartida}
            disabled={cargando}
          >
            ↻ REINICIAR REACTOR
          </button>
        </article>

        <article className="panel history-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">02 / REGISTRO DE SESIÓN</p>
              <h3>Intentos realizados</h3>
            </div>
            <span className="history-count">{intentos.length}/3</span>
          </div>

          <div className="attempt-list">
            {[0, 1, 2].map((index) => {
              const intento = intentos[index];

              return (
                <div className="attempt-row" key={index}>
                  <div className="attempt-index">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="attempt-info">
                    <strong>
                      {!intento
                        ? "Esperando intento"
                        : intento.numero === null
                          ? "Tiempo agotado"
                          : `Temperatura: ${intento.numero} °C`}
                    </strong>

                    <span>
                      {!intento
                        ? "SIN DATOS"
                        : intento.resultado === "correcto"
                          ? "NÚCLEO ESTABILIZADO"
                          : intento.resultado === "mas_baja"
                            ? "TEMPERATURA DEMASIADO BAJA"
                            : intento.resultado === "mas_alta"
                              ? "TEMPERATURA DEMASIADO ALTA"
                              : "TIEMPO AGOTADO"}
                    </span>
                  </div>

                  <div className={`attempt-indicator ${intento ? "used" : ""}`}>
                    {intento ? "●" : "○"}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={`core-visual ${tiempo <= 3 && estado === "jugando" ? "core-critical" : ""}`}
            style={{ "--progress": `${progreso}%` }}
          >
            <div className="core-ring ring-one" />
            <div className="core-ring ring-two" />

            <div className="core-progress">
              <div className="core-center">
                <span>TIEMPO</span>
                <strong>{estado === "jugando" ? tiempo : "--"}</strong>
                <small>SEGUNDOS</small>
              </div>
            </div>
          </div>

          <p className="visual-caption">
            {tiempo <= 3 && estado === "jugando"
              ? "⚠ NIVEL CRÍTICO DE CONTENCIÓN"
              : "UNIDAD DE CONTENCIÓN TÉRMICA"}
          </p>
        </article>
      </section>

      {terminado && partida && (
        <section className="panel results-panel">
          <p className="eyebrow">03 / INFORME DE MISIÓN</p>

          <h3>
            {estado === "victoria"
              ? "¡Reactor estabilizado!"
              : "Misión finalizada"}
          </h3>

          <div className="results-grid">
            <div>
              <span>OPERADOR</span>
              <strong>{partida.nombre}</strong>
            </div>

            <div>
              <span>NÚMERO SECRETO</span>
              <strong>{partida.temperaturaSecreta} °C</strong>
            </div>

            <div>
              <span>RESULTADO</span>
              <strong>{partida.resultado.toUpperCase()}</strong>
            </div>

            <div>
              <span>INTENTOS USADOS</span>
              <strong>{partida.cantidadIntentos}/3</strong>
            </div>
          </div>

          <p className="results-note">
            El registro completo de esta partida quedó guardado en el backend.
          </p>
        </section>
      )}

      <section className="panel global-history">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">04 / REGISTRO GENERAL</p>
            <h3>Historial global de misiones</h3>
            <p className="history-description">
              Todos los operadores que han intentado estabilizar el reactor.
            </p>
            
          </div>
          <span className="history-count">
            {historialGlobal.length} PARTIDAS
          </span>
        </div>

        <div className="global-stats">
          <div className="global-stat">
            <span>TOTAL DE PARTIDAS</span>
            <strong>{historialGlobal.length}</strong>
          </div>

          <div className="global-stat">
            <span>VICTORIAS</span>
            <strong className="stat-victory">
              {historialGlobal.filter(
                (p) => String(p.resultado).toLowerCase() === "victoria"
              ).length}
            </strong>
          </div>

          <div className="global-stat">
            <span>DERROTAS</span>
            <strong className="stat-defeat">
              {historialGlobal.filter(
                (p) => String(p.resultado).toLowerCase() === "derrota"
              ).length}
            </strong>
          </div>
        </div>

        {historialGlobal.length === 0 ? (
          <div className="empty-history">
            <span>◈</span>
            <p>Todavía no hay partidas finalizadas registradas.</p>
            <small>Completa una misión para inaugurar el historial.</small>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>OPERADOR</th>
                  <th>FECHA</th>
                  <th>N.º SECRETO</th>
                  <th>INTENTOS</th>
                  <th>RESULTADO</th>
                </tr>
              </thead>

              <tbody>
                {historialGlobal.map((p, index) => (
                  <tr key={p.id ?? `${p.nombre}-${p.fechaInicio}-${index}`}>
                    <td>{index + 1}</td>

                    <td>
                      <strong className="operator-name">
                        {p.nombre || "Operador"}
                      </strong>
                    </td>
                    <td>
                      {p.fechaFin
                        ? new Date(p.fechaFin).toLocaleString()
                        : "Sin fecha"}
                    </td>
                    <td>
                      {p.temperaturaSecreta != null
                        ? `${p.temperaturaSecreta} °C`
                        : "—"}
                    </td>
                    <td>{p.cantidadIntentos ?? p.intentos?.length ?? 0}/3</td>
                    <td>
                      <span
                        className={`result-badge ${
                          String(p.resultado).toLowerCase() === "victoria"
                            ? "result-win"
                            : "result-loss"
                        }`}
                      >
                        {String(p.resultado || "Desconocido").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="results-note">
          El historial se actualiza automáticamente con los registros del backend.
        </p>
      </section>

      /////////////////////////////////////////////


      <footer>
        <span>REACTOR CORE SYSTEMS</span>
        <span>ESTABILIZACIÓN TÉRMICA · V 1.0</span>
      </footer>
    </main>
  );
}

export default App;
