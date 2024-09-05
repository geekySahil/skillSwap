import mongoose, { Schema } from "mongoose";

const MateSchema = new mongoose.Schema({
    matchRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Matches',
        required: true,
    },
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [
        {
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            text: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
    meetings: [
        {
            topic: {
                type: String,
                required: true
            },
            time: {
                type: Date,
                required: true
            },
            scheduledBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref:'User',
                required: true
            },
            scheduledWith: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true

            }
            // status: {
            //     type: String,
            //     enum: ['scheduled', 'completed', 'cancelled'],
            //     default: 'scheduled'
            // }
        }
    ],
}, { timestamps: true });

const Mates = mongoose.model("Mates", MateSchema);

export default Mates