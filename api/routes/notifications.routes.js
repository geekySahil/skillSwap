import { Router } from "express";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import { setNotification, getNotifications, removeNotification } from "../controllers/notifications.controller.js";


const router = Router()

router.route('/set-notification').put(verifyJWT, setNotification)
router.route('/get-notifications').get(verifyJWT, getNotifications)
router.route('/remove-notifications/:notificationId').delete(verifyJWT, removeNotification)

export default router
