import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", auth, me);

export default router;