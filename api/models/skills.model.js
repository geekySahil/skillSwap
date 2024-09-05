import mongoose from "mongoose";
import User from "./user.model.js";

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ["programming", "design", "mathematics", "cooking", "writing", "marketing", "finance", "communication", "art and craft", "psycology", "reading", "others" ],
        required: true
    },
    creator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        requied: true
    },
    skill_level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner"
    }
}, {timestamps: true})

const Skills = mongoose.model("skills", skillSchema)

export default Skills