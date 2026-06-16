import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate, adminOnly } from "../middlewares/auth.middleware";

const router = Router();

// Tất cả routes đều yêu cầu authenticate + adminOnly
router.use(authenticate, adminOnly);

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

export default router;
