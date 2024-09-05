import mongoose from "mongoose";
import Skills from "../models/skills.model.js";
import { APIResponse } from "../utils/apiResponse.js"
import { APIError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";


const getSkills = asyncHandler(async(req, res) => {
    const userId = req.user?._id

    // console.log("successfull 2")


    try {
        const user = await User.findById(userId).populate('skills_collection')
    
        if(!user){
            throw new APIError(404, "User not found")
        }
    
        const skills = user.skills_collection

    
        
        res.status(200).json(new APIResponse(200, skills, "Skills collection fetched successfully"))
    } catch (error) {
        res.status(error.statusCode).json(new APIError(error.statusCode, error.message))
    }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////

const getWantedSkills = asyncHandler(async(req, res) => {
    const userId = req.user?._id

    // console.log("successfull 1")

    try {
        const user = await User.findById(userId).populate('skills_wanted')
    
        if(!user){
            throw new APIError(404, "User not found")
        }
    
        const wantedSkills = user.skills_wanted
    
        res.status(200).json(new APIResponse(200, wantedSkills, "Wanted Skills fetched successfully"))
    } catch (error) {
        res.status(error.statusCode).json(new APIError(error.statusCode, error.message))
        
    }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////

const addSkillsToCollection = asyncHandler(async (req, res, next) => {
    const { name, description, category, skillLevel } = req.body;
    const userId = req.user._id


    // console.log(name, description, category, skillLevel)

   try {
     if (!req.user || !userId) {
         throw new APIError(401, "unauthorized access")
     }
 
     if (
         [name, description, category, skillLevel].some((field) => field?.trim() === "")
     ) {
         throw new APIError(401, "All fields are required")
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
     }).populate('skills_collection')
 
     if (!updatedUser) {
         throw new APIError(401, "Something went wrong while adding skills")
     }
 
     res.status(200).json(new APIResponse(200, updatedUser.skills_collection, "Skills added successfully"))
   } catch (error) {
        res.status(error.statusCode).json(new APIError(error.statusCode, error.message))
    }


})

////////////////////////////////////////////////////////////////////////////////////////////////////////

const addWantedSkills = asyncHandler(async (req, res, next) => {
    const {name, description, category, skillLevel} = req.body

    try {
        if ([name, description, category, skillLevel].some((field) => field.trim() === "")) {
            throw new APIError(401, "all fields are required")
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
        }).populate('skills_wanted')
    
        if (!updatedUser) {
            throw new APIError(401, "Something went wrong while adding skill")
        }
    
        res.status(200).json(new APIResponse(200, updatedUser.skills_wanted, "Skill You want is Added successfully"))
    } catch (error) {
        res.status(error.statusCode).json(new APIError(error.statusCode, error.message))
        
    }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////

const deleteWantedSkill = asyncHandler(async(req, res) => {

    const skill_id = req.params.skill_id
    const userId = req.user._id

    const skillId = new mongoose.Types.ObjectId(skill_id)

    const deleteResponse = await Skills.findByIdAndDelete(skillId)

    console.log(deleteResponse)

    if(!deleteResponse){
        throw new APIError(404, "Skill not found")
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(userId, {
            $pull: {
                skills_wanted: skill_id 
        }
        }).populate('skills_wanted')
    
        console.log(updatedUser)
    
        if(!updatedUser){
            throw new APIError(401, "Something went wrong while removing the skill from user profile")
        }
    
        res.status(200).json(new APIResponse(201, updatedUser.skills_wanted, "skill removed successfully"))
    } catch (error) {
        res.status(error.statusCode).json(new APIError(error.statusCode, error.message))
    }
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const deleteSkillFromCollection = asyncHandler(async(req, res) => {

    const skill_id = req.params.skill_id
    const userId = req.user._id

   try {
     const skillId = new mongoose.Types.ObjectId(skill_id)
 
     const deleteResponse = await Skills.findByIdAndDelete(skillId)
 
     if(!deleteResponse){
         throw new APIError(404, "Skill not found")
     }
 
     const updatedUser = await User.findByIdAndUpdate(userId, {
         $pull: {
             skills_collection: skill_id // Assuming the field name for skills is 'skills_collection'
         }
     }).populate('skills_collection')
 
     if(!updatedUser){
         throw new APIError(401, "Something went wrong while removing the skill from user profile")
     }
 
     res.status(200).json(new APIResponse(201, updatedUser.skills_collection, "skill removed successfully"))
   } catch (error) {
    res.status(error.statusCode).json(new APIError(error.statusCode, error.message))

   }
})

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateWantedSkillDetails = asyncHandler(async(req, res, next ) => {

    const {name, description, category, skillLevel} = req.body;
    const skill_id = req.params.skill_id 
    const userId = req.user?._id


   try {
     // Step 1: Check if the user has the specified skill in their skills_wanted array

     if (
        [name, description, category, skillLevel].some((field) => !field || field?.trim() === "")
    ) {
        throw new APIError(400, "All fields are required")
    }
    
     
 
     // Step 2: Update the skill in the Skills collection
     const updatedSkill = await Skills.findOneAndUpdate(
         { _id: skill_id },
         {
             $set: {
                 name: name.trim(),
                 description: description.trim(),
                 category: category.trim(),
                 skill_level: skillLevel.trim()
             }
         },
         { new: true }
     );
 
     if (!updatedSkill) {
         throw new APIError(401, 'Skill not found or update failed');
     }

     const user = await User.findOne({ _id: userId, skills_wanted: skill_id }).populate('skills_wanted');
 
     if (!user) {
         throw new APIError(404, 'User or skill not found in user\'s skills_wanted array');
     }
 
     console.log(updatedSkill);
 
     res.status(201).json(new APIResponse(201, user.skills_wanted, "skill details updated successfully"))
   } catch (error) {
        res.status(error.statusCode || 500).json(new APIError(error.statusCode, error.message))
    }
})

//////////////////////////////////////////////////////////////////////////////////////////////

const updateSkillDetails = asyncHandler(async(req, res) => {
    const {name, description, category, skillLevel} = req.body;
    const skill_id = req.params.skill_id
    const userId = req.user._id

   try {
     if (
         [name, description, category, skillLevel].some((field) => !field || field?.trim() === "")
     ) {
         throw new APIError(400, "All fields are required")
     }
     
 
     const skillId = new mongoose.Types.ObjectId(skill_id)
 
     const updatedDetails = await Skills.findOneAndUpdate(
         {_id : skillId},
         {
             $set: {
                 name: name.trim(),
                 description: description.trim(),
                 category: category.trim(),
                 skill_level: skillLevel.trim()
             }
         }, {new:true})
 
 
     console.log(updatedDetails)
     
     if(!updatedDetails){
         throw new APIError(404, "update failed")
     }
     const user = await User.findOne({_id: userId, skills_collection: skill_id}).populate('skills_collection')
 
     console.log(user.skills_collection)
 
     if(!user){
         throw new APIError(404, "Skill not found in user's skills_collection array")
     }
 
     res.status(201).json(new APIResponse(201, user.skills_collection, "skill details updated successfully"))
   } catch (error) {
        res.status(error.statusCode || 500).json(new APIError(error.statusCode, error.message))
    }
})


export { getWantedSkills, getSkills, addSkillsToCollection, addWantedSkills, deleteWantedSkill, deleteSkillFromCollection, updateWantedSkillDetails, updateSkillDetails}