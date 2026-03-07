import { Router } from "express";

import { searchController } from "../controller/search";
import { validateQuery } from "../middleware/validate";
import { searchSchema } from "../validation/search.schema";

const router = Router();

router.get("/", validateQuery(searchSchema), searchController);

export default router;
