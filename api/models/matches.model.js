import mongoose from "mongoose";


const matchesSchema = new mongoose.Schema({
    user1_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    user2_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "declined"],
        default: "pending"
    }, 
    scheduledTime: {
        type: Date
    }
}, {timestamps: true})

const Matches = mongoose.model("Matches", matchesSchema);

export default Matches