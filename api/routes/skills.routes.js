import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/verifyJWT.js"
import  { getWantedSkills, getSkills, addSkillsToCollection, addWantedSkills, deleteWantedSkill, deleteSkillFromCollection, updateWantedSkillDetails, updateSkillDetails} from "../controllers/skills.controller.js"


const router = Router()

router.route("/wanted-skills").get(verifyJWT, getWantedSkills)
router.route("/skills-collection").get(verifyJWT, getSkills)
router.route("/add-skill").post(verifyJWT, addSkillsToCollection)
router.route("/add-wantedSkill").post(verifyJWT, addWantedSkills)
router.route('/update-wanted-skill/:skill_id').put(verifyJWT, updateWantedSkillDetails)
router.route('/update-skill/:skill_id').put(verifyJWT, updateSkillDetails)
router.route('/delete-wanted-skill/:skill_id').delete(verifyJWT, deleteWantedSkill)
router.route('/delete-skill/:skill_id').delete(verifyJWT, deleteSkillFromCollection)



export default router