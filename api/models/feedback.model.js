import mongoose from "mongoose";
import User from "./user.model.js";

const feedbackSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    from_user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating:{
        type: Number,
        min: 1, 
        max: 5, 
        required: true

    }, 
    comment: {
        type: String
    }
}, {timestamps: true})


const Feedback = mongoose.model("Feedback", feedbackSchema)

export default Feedback

