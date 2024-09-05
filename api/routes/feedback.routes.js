import { addFeedback, deleteFeedback, updateFeedback, getAllFeedback } from "../controllers/feedback.controller.js"
import { verifyJWT } from "../middlewares/verifyJWT.js"
import { Router } from "express"

const feedbackRouter = Router()

feedbackRouter.route('/add-feedback/:userId').post(verifyJWT, addFeedback)
feedbackRouter.route('/delete-feedback/:feedbackId').delete(verifyJWT, deleteFeedback)
feedbackRouter.route('/update-feedback/:feedbackId').post(verifyJWT, updateFeedback)
feedbackRouter.route('/get-feedbacks/:userId').get(verifyJWT, getAllFeedback)


export default feedbackRouter
