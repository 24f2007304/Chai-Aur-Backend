import {Router} from "express";
import { registrationUser } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registrationUser)

export default router ;