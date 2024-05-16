import mongoose from "mongoose";
import Skills from "../models/skills.model.js";
import { APIResponse } from "../utils/apiResponse.js"
import { APIError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";


const getSkills = asyncHandler(async(req, res) => {
    const userId = req.user?._id

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const skills = user.skills_collection

    res.status(200).json(200, skills, "Skills collection fetched successfully")
})


const getWantedSkills = asyncHandler(async(req, res) => {
    const userId = req.user?._id

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const wantedSkills = user.skills_wanted

    res.status(200).json(200, skills, "Wanted Skills fetched successfully")
})

const addSkillsToCollection = asyncHandler(async (req, res, next) => {
    const { name, description, category, skillLevel } = req.body;
    const userId = req.user._id

    if (!req.user || !userId) {
        return res.status(401).json({ "unauthorised access"})
    }

    if (
        [name, description, category, skillLevel].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const newSkill = await Skills.create({
        name: name,
        description: description,
        creator_id: userId,
        category: category,
        skill_level: skillLevel

    })

    const updatedUser = await User.findByIdAndUpdate(userId, {
        $addToSet: {
            skills_collection: newSkill._id
        }
    })

    if (!updatedUser) {
        throw new ApiError(401, "Something went wrong while adding skills")
    }

    res.status(200).json(new APIResponse(200, updatedUser, "Skills added successfully"))


})

const addWantedSkills = asyncHandler(async (req, res, next) => {
    const [name, description, category, skillLevel] = req.body

    if ([name, description, category, skillLevel].some((field) => field.trim() === "")) {
        throw new ApiError(401, "all fields are required")
    }

    const userId = req.user._id
    if (!req.user || !userId) {
        res.status(200).json({ message: "unauthorised access" })
    }

    const newWantedSkill = await Skills.create({
        name: name,
        description: description,
        category: category,
        creator_id: userId,
        skillLevel: skillLevel
    })

    const updatedUser = await User.findByIdAndUpdate(userId, {
        $addToSet: {
            skills_wanted: newWantedSkill._id
        }
    })

    if (updatedUser) {
        throw new ApiError(401, "Something went wrong while adding skill")
    }

    res.status(200).json(new APIResposnse(200, updatedUser, "Skill You want is Added successfully"))
})


    const deleteWantedSkill = asyncHandler(async(req, res) => {

    const skill_id = req.params.skill_id

    const deleteResponse = await Skills.findByIdAndDelete(skill_id)

    if(!deleteResponse){
        throw new ApiError(404, "Skill not found")
    }

    const updatedUser = await User.findByIdAndUpdate(userId, {
        $pull: {
            skills_wanted: skill_id // Assuming the field name for skills is 'skills_wanted'
        }
    })

    if(!updatedUser){
        throw new ApiError(401, "Something went wrong while removing the skill from user profile")
    }

    res.status(200).json(new APIResponse(201, updatedUser, "skill removed successfully"))
})

const deleteSkillFromCollection = asyncHandler(async(req, res) => {

    const skill_id = req.params.skill_id

    const deleteResponse = await Skills.findByIdAndDelete(skill_id)

    if(!deleteResponse){
        throw new ApiError(404, "Skill not found")
    }

    const updatedUser = await User.findByIdAndUpdate(userId, {
        $pull: {
            skills_collection: skill_id // Assuming the field name for skills is 'skills_collection'
        }
    })

    if(!updatedUser){
        throw new ApiError(401, "Something went wrong while removing the skill from user profile")
    }

    res.status(200).json(new APIResponse(201, updatedUser, "skill removed successfully"))
})

const updateWantedSkillDetails = asyncHandler(async(req, res) => {
    const {name, description, category, skillLevel} = req.body;
    const skill_id = req.params.skill_id

    if (
        [name, description, category, skillLevel].some((field) => !field || field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }



    const updatedDetails = await Skills.findByIdAndUpdate(skill_id, {
        $set:{
            name: name, 
            description: description,
            category: category,
            skillLevel: skillLevel
        }
    })

    const userId = req.user?._id

    const updatedUser = await User.findOneAndUpdate({_id: userId, "skills_wanted._id": skill_id},
    {
        $set:{"skills_wanted.$": updatedDetails} // $ identifies the matched element from the above query without specifying its position
    }, 
    {new: true}
)

    if(!updatedUser){
        throw new ApiError(404, "skill not found")
    }

    res.status(201).json(new APIResponse(201, updatedUser, "skill details updated successfully"))
})

const updateSkillDetails = asyncHandler(async(req, res) => {
    const {name, description, category, skillLevel} = req.body;
    const skill_id = req.params.skill_id

    if (
        [name, description, category, skillLevel].some((field) => !field || field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }



    const updatedDetails = await Skills.findByIdAndUpdate(skill_id, {
        $set:{
            name: name, 
            description: description,
            category: category,
            skillLevel: skillLevel
        }
    })

    const userId = req.user?._id

    const updatedUser = await User.findOneAndUpdate({_id: userId, "skills_collection._id": skill_id},
    {
        $set:{"skills_collection.$": updatedDetails} // $ identifies the matched element from the above query without specifying its position
    }, 
    {new: true}
)

    if(!updatedUser){
        throw new ApiError(404, "skill not found")
    }

    res.status(201).json(new APIResponse(201, updatedUser, "skill details updated successfully"))
})


export { getWantedSkills, getSkills, addSkillsToCollection, addWantedSkills, deleteWantedSkill, deleteSkillFromCollection, updateWantedSkillDetails, updateSkillDetails}