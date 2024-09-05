import { Router } from "express";
import { registerUser, loginUser , logoutUser, refreshAccessToken, getCurrentUser,updateAccountDetails, deleteUserAccount, changeProfilePicture, changePassword, searchUserByName } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/verifyJWT.js"



const router = Router();

router.route("/signup").post(
    upload.single('profilePicture'),
    registerUser,
    
);

router.route("/login").post(loginUser)
router.route("/logout").delete(verifyJWT,logoutUser)
router.route("/refresh").post(refreshAccessToken)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").post(verifyJWT, updateAccountDetails)
router.route("/change-profile").post(verifyJWT, upload.single('profilePicture'), changeProfilePicture)
router.route("/change-password").post(verifyJWT, changePassword)
router.route("/delete-user").delete(verifyJWT, deleteUserAccount)
router.route('/search/:username').get(verifyJWT, searchUserByName)


export default router