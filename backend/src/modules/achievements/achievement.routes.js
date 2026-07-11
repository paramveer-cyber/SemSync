import express from "express";
import { listCatalog } from "./achievement.catalog.js";

const router = express.Router();

router.get("/catalog", listCatalog);

export default router;
