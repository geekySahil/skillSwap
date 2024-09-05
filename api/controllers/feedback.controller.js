import mongoose from "mongoose";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";
import User from "../models/user.model.js";
import Skills from "../models/skills.model.js";
import Matches from '../models/matches.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import Feedback from "../models/feedback.model.js";



const addFeedback = asyncHandler(async(req, res) => {
    
    try {

        console.log("starting feedback function..")
        const {rating, review} = req.body;
        const userId = req.user._id;
        const userIdForFeedback = req.params.userId;

        // console.log(review)

        console.log('Received request with rating:', rating, 'and review:', review)

    
        if(!rating && !review){
            throw new APIError("atleast give one input")
        }

        // console.log('Input validation passed.');

    
        const feedback = await Feedback.create({
            user_id: userIdForFeedback,
            from_user_id : userId,
            rating: rating ? Number(rating) : null,
            comment: review ? review.toString() : ""
        })

        // console.log('Feedback created:', feedback);

        const populatedFeedback = await feedback.populate({
            path: 'from_user_id',
            select: 'username profilePicture'
        })

        if(!populatedFeedback){
            throw new APIError(401, "Feedback failed")
        }



        const updatedUser = await User.findByIdAndUpdate(userIdForFeedback, {
            $addToSet: {
                reviews: populatedFeedback.toObject()
            }
        })


        if(!updatedUser){
            throw new APIError(401, "feedback failed")
        }

        console.log('Sending success response.');

    
        res.status(201).json(new APIResponse(201, populatedFeedback, "feedback added successfully"))
    
    } catch (error) {
        console.log("error occured")
        res.status(error.statusCode || 401).json(new APIError(error.statusCode || 401, error.message  || "failed"))

    }

    

})

const getAllFeedback = asyncHandler(async(req, res)=> {
    try {
        const userId = req.params.userId

        console.log(userId)
    
        if(!userId){
            throw new APIError("cannot fetch feedbacks of this user")
        }
    
        const feedbacks = await Feedback.find({user_id: userId}).populate({
            path: 'from_user_id',
            select: 'username profilePicture' // Select fields you want to include
          });
    

        console.log(feedbacks.length)
    
        res.status(200).json(new APIResponse(200, feedbacks, "feedbacks fetched successfully"))
    } catch (error) {
        res.status(error.statusCode).json(new APIError(error.statusCode, error.message))

    }
})


const updateFeedback = asyncHandler(async(req, res) => {
    try {
        const { feedbackId } = req.params; // Extract feedback ID from URL parameters
        const { rating, review } = req.body; // Extract updated rating and comment from request body

        // Find the feedback by ID
        let feedback = await Feedback.findById(feedbackId)

        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        console.log(feedback.from_user_id.toString(), '!==' ,req.user._id.toString())

        if(feedback.from_user_id.toString() !== req.user._id.toString()){
            throw new APIError(401, "unauthorized access: cannot update feedback of other user");
        }

        
        // Update the feedback with the provided data
        feedback.rating = rating || feedback.rating
        feedback.comment = review || feedback.comment;

        // Save the updated feedback to the database
        await feedback.save();

        // Respond with the updated feedback object
        res.status(201).json(new APIResponse(201, feedback, "feedback updated successfully"));
    } catch (error) {
        res.status(error.statusCode || 401).json(new APIError(error.statusCode || 401, error.message || "something went wrong"))

    }
}
)


const deleteFeedback = asyncHandler(async(req, res)=> {
    const feedbackId = req.params.feedbackId

   try {
     if(!feedbackId){
         throw new APIError("Cant delete feedback now ")
     }
 
     const delResponse = await Feedback.findByIdAndDelete(feedbackId);
 
 
     if(!delResponse){
         throw new APIError("something went wrong deleting feedback")
     }
 
     res.status(200).json(new APIResponse(200, feedbackId, "feedback deleted successfully"))
   } catch (error) {
    res.status(error.statusCode).json(new APIError(error.statusCode, error.message))

   }
})

export {addFeedback, updateFeedback,deleteFeedback, getAllFeedback}