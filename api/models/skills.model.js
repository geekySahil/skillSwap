import mongoose from "mongoose";

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
        required: true
    },
    creator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        requied: true
    },
    skill_level: {
        type: String,
        enum: ["begginer", "intermediate", "advanced"],
        default: "begginer"
    }
}, {timestamps: true})

const Skills = mongoose.model("skills", skillSchema)

export default Skills