import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  UncontrolledAlert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap";
import MissionPanel from "./components/MissionPanel";
import Catalog from "./components/Catalog";
import CargoBay from "./components/CargoBay";
import {
  obtenerInventario,
  obtenerCarga,
  agregarSuministro,
  actualizarUnidades,
  eliminarSuministro,
  reiniciarSesion,
} from "./services/api";

// Tiempo de la ventana de lanzamiento (en segundos)
const DURACION_VENTANA = 300;

function App() {
  // ---------- ESTADO ----------
  const [inventario, setInventario] = useState([]); // array de suministros
  const [carga, setCarga] = useState({ creditos: 0, itemsCargados: [], total: 0 });
  const [error, setError] = useState(null); // { id, texto }
  const [calculando, setCalculando] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(DURACION_VENTANA);

  const sesionActiva = tiempoRestante > 0;

  // ---------- CARGAR DATOS ----------
  // Pide inventario y carga al mismo tiempo (Endpoints 1 y 2).
  const cargarDatos = async () => {
    const [datosInventario, datosCarga] = await Promise.all([
      obtenerInventario(),
      obtenerCarga(),
    ]);
    setInventario(datosInventario);
    setCarga(datosCarga);
    // Si el backend manda el tiempo restante, el reloj se sincroniza con él
    if (typeof datosCarga.tiempoRestante === "number") {
      setTiempoRestante(datosCarga.tiempoRestante);
    }
  };

  // Se ejecuta UNA vez al abrir la página (arreglo de dependencias vacío)
  useEffect(() => {
    cargarDatos().catch(manejarFallo);
  }, []);

  // ---------- TEMPORIZADOR ----------
  // Cada segundo baja el contador. Se limpia el intervalo al terminar.
  useEffect(() => {
    if (!sesionActiva) return;
    const intervalo = setInterval(() => {
      setTiempoRestante((actual) => actual - 1);
    }, 1000);
    return () => clearInterval(intervalo);
  }, [sesionActiva]);

  // ---------- ERRORES ----------
  // El id cambia en cada error para que la alerta reaparezca aunque
  // el usuario haya cerrado la anterior.
  const mostrarError = (texto) => setError({ id: Date.now(), texto });

  // Si la sesión expiró (410) se abre el modal; cualquier otro error
  // se muestra en la alerta amarilla.
  const manejarFallo = (err) => {
    if (err.sesionExpirada) {
      setTiempoRestante(0);
      return;
    }
    mostrarError(err.message);
  };

  // ---------- ACCIONES ----------
  // Envuelve cualquier acción: muestra "Calculando peso...", ejecuta la
  // petición, vuelve a pedir los datos y captura errores del backend.
  const ejecutarAccion = async (accion) => {
    setCalculando(true);
    setError(null);
    try {
      await accion();
      await cargarDatos();
    } catch (err) {
      manejarFallo(err);
    } finally {
      setCalculando(false);
    }
  };

  const manejarAgregar = (equipoId) =>
    ejecutarAccion(() => agregarSuministro(equipoId, 1));

  const manejarCambiarCantidad = (id, nuevaCantidad) =>
    ejecutarAccion(() => actualizarUnidades(id, nuevaCantidad));

  const manejarEliminar = (id) => ejecutarAccion(() => eliminarSuministro(id));

  const manejarReinicio = async () => {
    setError(null);
    setTiempoRestante(DURACION_VENTANA);
    try {
      await reiniciarSesion();
      try {
        await cargarDatos();
      } catch (err) {
        // Si el backend aún respondía 410, ya reinició la sesión: se repite
        if (!err.sesionExpirada) throw err;
        await cargarDatos();
      }
    } catch (err) {
      manejarFallo(err);
    }
  };

  // ---------- RENDER ----------
  return (
    <Container className="py-3">
      <MissionPanel
        creditos={carga.creditos}
        total={carga.total}
        tiempoRestante={tiempoRestante}
        calculando={calculando}
      />

      {error && (
        <UncontrolledAlert key={error.id} color="warning">
          {error.texto}
        </UncontrolledAlert>
      )}

      <Row>
        <Col lg="8">
          <h2 className="h4 text-light mb-3">Catálogo de la base</h2>
          <Catalog
            inventario={inventario}
            onAgregar={manejarAgregar}
            deshabilitado={calculando || !sesionActiva}
          />
        </Col>
        <Col lg="4">
          <h2 className="h4 text-light mb-3">Tu bodega de carga</h2>
          <CargoBay
            itemsCargados={carga.itemsCargados}
            inventario={inventario}
            onCambiar={manejarCambiarCantidad}
            onEliminar={manejarEliminar}
            deshabilitado={calculando || !sesionActiva}
          />
        </Col>
      </Row>

      {/* Se abre solo cuando se acaba el tiempo */}
      <Modal isOpen={!sesionActiva} centered backdrop="static" keyboard={false}>
        <ModalHeader>Ventana de lanzamiento cerrada</ModalHeader>
        <ModalBody>
          Se agotó el tiempo y la carga no se completó. La sesión se cerró:
          inicia una nueva para volver a armar el manifiesto.
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={manejarReinicio}>
            Iniciar nueva sesión
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}

export default App;
