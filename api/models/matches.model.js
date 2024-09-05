import mongoose from "mongoose";
import User from "./user.model.js";


const matchesSchema = new mongoose.Schema({
  
        user1: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            status: {
                type: String,
                enum: ["pending", "accepted", "declined"],
                default: "pending"
            }
        },
        user2: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            status: {
                type: String,
                enum: ["pending", "accepted", "declined"],
                default: "pending"
            }
        },

    }, { timestamps: true });
const Matches = mongoose.model("Matches", matchesSchema);

export default Matches