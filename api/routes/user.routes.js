import { Router } from "express";
import { registerUser, loginUser , logoutUser, refreshAccessToken} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/verifyJWT.js"



const router = Router();

router.route("/signup").post(
    upload.single('profile'),
    registerUser
);

router.route("/login").post(loginUser)
router.route("/")

export default router