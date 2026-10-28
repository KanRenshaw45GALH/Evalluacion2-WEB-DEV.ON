import { Router } from "express";
import { estado } from "../estado.js";

const router = Router();
router.get("/", (req, res) => {
res.json(estado.inventario);
});

export default router;