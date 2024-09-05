import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema({
   
            type:{
                type: String,
                enum: ['new_message', 'scheduled_meeting', 'request', 'review' ],
                required: true
            },
            from: {
                type:  mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            to: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            note: {
                type: String,
                required: true
            },
            
}, { timestamps: true });

const Notifications = mongoose.model("Notifications", notificationSchema);

export default Notifications