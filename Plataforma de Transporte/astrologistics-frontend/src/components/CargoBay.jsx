import { ListGroup, ListGroupItem, ButtonGroup, Button } from "reactstrap";

function CargoBay({ itemsCargados, inventario, onCambiar, onEliminar, deshabilitado }) {
  // La carga solo trae { id, cantidad }. El nombre y el precio salen
  // de cruzar ese id con el inventario.
  if (itemsCargados.length === 0) {
    return (
      <ListGroup>
        <ListGroupItem>Tu bodega está vacía. Añade suministros desde el catálogo.</ListGroupItem>
      </ListGroup>
    );
  }

  return (
    <ListGroup>
      {itemsCargados.map((item) => {
        const producto = inventario.find((p) => p.id === item.id);
        if (!producto) return null; // el inventario aún no termina de cargar

        return (
          <ListGroupItem key={item.id}>
            <div className="fw-bold">{producto.nombre}</div>
            <div className="text-muted small mb-2">
              {item.cantidad} x {producto.precio} Cr = {item.cantidad * producto.precio} Cr
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <ButtonGroup size="sm">
                <Button
                  outline
                  disabled={deshabilitado}
                  onClick={() => onCambiar(item.id, item.cantidad - 1)}
                >
                  -
                </Button>
                <Button outline disabled>
                  {item.cantidad}
                </Button>
                <Button
                  outline
                  disabled={deshabilitado}
                  onClick={() => onCambiar(item.id, item.cantidad + 1)}
                >
                  +
                </Button>
              </ButtonGroup>

              <Button
                color="danger"
                outline
                size="sm"
                disabled={deshabilitado}
                onClick={() => onEliminar(item.id)}
              >
                Desembarcar
              </Button>
            </div>
          </ListGroupItem>
        );
      })}
    </ListGroup>
  );
}

export default CargoBay;
