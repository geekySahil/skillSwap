import { Router } from "express";
import { getMatchesForUser, findMatches, requestForCollab } from "../controllers/matches.controller.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";


const router = Router()

router.route('/find-matches').get(verifyJWT, findMatches)
router.route('/get-match').get(verifyJWT, getMatchesForUser);
router.route('/update-match-status/:matchId').post(verifyJWT, requestForCollab);


export default router