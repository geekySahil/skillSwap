import mongoose from "mongoose";
import { APIError } from "../utils/apiError.js";
import { APIResposnse } from "../utils/apiResponse.js";
import User from "../models/user.model.js";
import Skills from "../models/skills.model.js";
import Matches from '../models/matches';
import { asyncHandler } from "../utils/asyncHandler";
import Feedback from "../models/feedback.model.js";



const addFeedback = asynchandler(async(req, res) => {
    
    try {
        const {rating, review} = req.body;
        const userId = req.user._id;
        const userIdForFeedback = req.params.userId;
    
        if(!rating && !review){
            throw new APIError("atleast give one input")
        }
    
        const feedback = await Feedback.create({
            user_id: req.params._id,
            from_user_id : userId,
            rating: rating.toNumber(),
            review: review
        })
    
        await feedback.save({validateBeforeSave: false})
    
        res.status(201).json(new APIResposnse(201, feedback, "feedback added successfully"))
    
    } catch (error) {
        throw new APIError("Error occured in Feedback:" + error)
    }

    

})

const getAllFeedback = asyncHandler(async(req, res)=> {
    try {
        const userId = req.params.userId
    
        if(!userId){
            throw new APIError("cannot fetch feedbacks of this user")
        }
    
        const feedbacks = await Feedback.find({user_id: userId})
    
        if(feedbacks.length < 0){
            throw new APIError("no feedbacks yet")
        }
    
        res.status(200).json(200, feedbacks, "feedbacks fetched successfully")
    } catch (error) {
        throw new APIError("Error: ", error)
    }
})


const updateFeedback = asyncHandler(async(req, res) => {
    try {
        const { feedbackId } = req.params; // Extract feedback ID from URL parameters
        const { rating, comment } = req.body; // Extract updated rating and comment from request body

        // Find the feedback by ID
        let feedback = await Feedback.findById(feedbackId);

        // If feedback is not found
        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        // Update the feedback with the provided data
        feedback.rating = rating;
        feedback.comment = comment;

        // Save the updated feedback to the database
        await feedback.save();

        // Respond with the updated feedback object
        res.status(201).json(new APIResposnse(201, feedback, "feedback updated successfully"));
    } catch (error) {
        console.error('Error updating feedback:', error);
        res.status(500).json({ error: 'Server error' });
    }
}
)


const deleteFeedback = asyncHandler(async(req, res)=> {
    const feedbackId = req.params.feedbackId

    if(!feedbackId){
        throw new APIError("Cant delete feedback now ")
    }

    const delResponse = await Feedback.findByIdAndDelete(feedbackId);

    if(!delResponse){
        throw new APIError("something went wrong deleting feedback")
    }

    res.status(200).json(new APIResposnse(200, {}, "feedback deleted successfully"))
})

export {addFeedback, updateFeedback,deleteFeedback, getAllFeedback}