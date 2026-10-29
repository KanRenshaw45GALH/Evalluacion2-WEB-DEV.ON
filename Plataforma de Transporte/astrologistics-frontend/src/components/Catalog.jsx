import { Row, Col, Card, CardBody, CardTitle, CardSubtitle, Badge, Button } from "reactstrap";

function Catalog({ inventario, onAgregar, deshabilitado }) {
  return (
    <Row>
      {/* .map() recorre el arreglo y devuelve una tarjeta por suministro */}
      {inventario.map((item) => {
        const agotado = item.stock === 0;

        return (
          <Col md="4" xs="12" key={item.id}>
            <Card className="mb-3 h-100">
              <CardBody className="d-flex flex-column">
                <CardTitle tag="h5">{item.nombre}</CardTitle>
                <CardSubtitle className="mb-2 text-muted">{item.categoria}</CardSubtitle>

                <div className="mb-2">
                  <Badge color="success" className="fs-6">
                    {item.precio} Cr
                  </Badge>
                </div>

                <p className="mb-3">Stock disponible: {item.stock}</p>

                {agotado ? (
                  <Button color="secondary" disabled className="mt-auto">
                    Agotado en Base
                  </Button>
                ) : (
                  <Button
                    color="primary"
                    className="mt-auto"
                    disabled={deshabilitado}
                    onClick={() => onAgregar(item.id)}
                  >
                    Añadir a la Nave
                  </Button>
                )}
              </CardBody>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}

export default Catalog;
