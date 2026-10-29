import { Alert, Badge } from "reactstrap";

// Convierte segundos a formato m:ss (ej. 125 -> "2:05")
const formatearTiempo = (segundos) => {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${String(resto).padStart(2, "0")}`;
};

function MissionPanel({ creditos, total, tiempoRestante, calculando }) {
  return (
    <Alert color="info" className="d-flex flex-wrap justify-content-between align-items-center gap-2">
      <span>
        <strong>Créditos disponibles:</strong> {creditos} Cr
      </span>

      <span>
        Costo total de carga:{" "}
        <Badge color="dark" pill>
          {total} Cr
        </Badge>
      </span>

      <span>
        Ventana de lanzamiento:{" "}
        <Badge color={tiempoRestante <= 60 ? "danger" : "secondary"} pill>
          {formatearTiempo(tiempoRestante)}
        </Badge>
      </span>

      {calculando && <em>Calculando peso...</em>}
    </Alert>
  );
}

export default MissionPanel;
