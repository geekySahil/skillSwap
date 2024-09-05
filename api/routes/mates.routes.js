import { Router } from "express";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import {createNewMate, deleteMessage, getAllMates, getAllMessages, saveMessageToDatabase,fetchMeetingsForAllMates, unmate, setMeeting,cancelMeeting, getAllMeetings} from "../controllers/mates.controller.js"


const router = Router()


router.route('/create-new-mate').post(verifyJWT, createNewMate)
router.route('/get-mates').get(verifyJWT, getAllMates)
router.route('/save-messages/:mateId').put(saveMessageToDatabase);
router.route('/delete-message/:mateId').delete(deleteMessage);
router.route('/messages/:mateId').get(getAllMessages)
router.route('/unmate/:mateId').delete(verifyJWT, unmate)
router.route('/set-meeting/:mateId').post(verifyJWT, setMeeting);
router.route('/cancel-meeting/:mateId').delete(verifyJWT, cancelMeeting);
router.route('/meetings/:mateId').get( verifyJWT, getAllMeetings)
router.route('/cancel-meeting/:mateId').delete(verifyJWT, cancelMeeting)
router.route('/get-all-meetings/:userId').get(verifyJWT, fetchMeetingsForAllMates)


export default router