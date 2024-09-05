import mongoose from "mongoose";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";
import Matches from '../models/matches.model.js';
import Skills from "../models/skills.model.js";
import User from '../models/user.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";



const findMatches = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    try {
        // Get the current user and their populated skills/interests
        const currentUser = await User.findById(userId).populate('skills_collection skills_wanted')
   

        // console.log(currentUser.skills_collection)
        // console.log('......',currentUser.skills_wanted)


        if (!currentUser) {
            throw new APIError(404, "Current user not found");
        }

        const currentUserSkillCategories = currentUser.skills_collection
            .filter(skill => skill.category) // Ensure the skill has a category
            .map(skill => skill.category.toLowerCase());

        const currentUserInterestCategories = currentUser.skills_wanted
            .filter(skill => skill.category) // Ensure the skill has a category
            .map(skill => skill.category.toLowerCase());

            // console.log(currentUserInterestCategories)

        // Get all other users who have skills or interests, excluding the current user
        const otherUsers = await User.find({
            _id: { $ne: userId },
            $or: [
                { skills_collection: { $exists: true, $ne: [] } }, // skills
                { skills_wanted: { $exists: true, $ne: [] } }      // interests
            ]
        }).populate('skills_collection skills_wanted')
 

        // console.log('otherUsers', otherUsers)



        // Iterate through other users to find matches
        for (let i = 0; i < otherUsers.length; i++) {
            const potentialMatch = otherUsers[i];
            // console.log('potentialmathskillscollection', potentialMatch.skills_collection)
            const potentialMatchSkillCategories = potentialMatch.skills_collection
                .filter(skill => skill.category) // Ensure the skill has a category
                .map(skill => skill.category.toLowerCase());

                // console.log('potential match skills  ', i , potentialMatch)

            // console.log('potentialMatchSkillCategories',potentialMatchSkillCategories)

            // Find common categories

            // console.log('currentUserInterestCategories', currentUserInterestCategories)
            const commonCategories = potentialMatchSkillCategories.filter(category =>
                currentUserInterestCategories.includes(category)
            );

            // console.log('commonCategories',commonCategories)

            // If there are common categories, create a match
            if (commonCategories.length > 0) {
                // Check if a match already exists between these users
                const existingMatch = await Matches.findOne({
                    $or: [
                        { $and: [{ 'user1.id': currentUser._id }, { 'user2.id': potentialMatch._id }] }, 
                        { $and: [{ 'user1.id': potentialMatch._id }, { 'user2.id': currentUser._id }] }
                    ]
                    
                });

                // console.log("existing" + i + existingMatch)

                if (!existingMatch) {
                    // Create a new match
                    const match = new Matches({
                        user1: {
                            id: currentUser._id,
                            status: 'pending'
                        },
                        user2: {
                            id: potentialMatch._id,
                            status: 'pending'
                        },
                    });
                    await match.save();
                    // // Add the match to the matches array
                    // console.log(match)
                    // matches.push(match.user2_id);

                }
            }
        }

        

        const potentialMatches = await Matches.find({
                $or: [
                    { 'user1.id': currentUser._id },
                    { 'user2.id': currentUser._id }
                ]
            })

            // console.log('potential Matches ', potentialMatches)


    
          
      
        // Filter out currentUser details from the results
        
        const filteredMatches = potentialMatches.map(match => {
            if (match.user1.id.toString() === currentUser._id.toString()) {
                // console.log("true")
                // console.log(match.user1.id.toString(), " === ", currentUser._id.toString())
            return  {
                _id: match._id,
                user: match.user2.id,
                yourStatus: match.user1.status,
                matchStatus: match.user2.status

              
              }
            } else {
                // console.log("false")
                // console.log(match.user1.id.toString(), " !== ", currentUser._id.toString())
            return {
                _id: match._id,
                user: match.user1.id,
                yourStatus: match.user2.status,
                matchStatus: match.user1.status
                
              }
            }
        })
        // console.log(filteredMatches)

        for (const match of filteredMatches) {
            console.log('uaser ', match.user)
           
            try {
                
                const populatedUser = await User.findById(match.user)
                    .select(["-password", "-refresh_token"])
                    .populate('skills_collection')
                    .populate('skills_wanted')
                    .lean();


                match.user = populatedUser;

                console.log('user', match.user)
                if(match.user === null) {
                    await Matches.findByIdAndDelete(match._id)
                    continue
                }
              
            } catch (err) {
                console.error(err);
                // Handle the error appropriately
            }
        }

        // console.log('filteredMatches', filteredMatches)


        res.status(200).json(new APIResponse(200, filteredMatches, "Here are your matches"));


        // console.log(matches.length)
        

        
    } catch (error) {
        res.status(400).json(new APIError(400, error.message))

    }

   
});

    
//////////////////////////////////////////////////////////////////////////////////

// Controller function to get matches for a user
const getMatchesForUser = async (req, res) => {


    // console.log(req.user?._id)
    try {
        // Find matches where the user is either user1 or user2
        const potentialMatches = await Matches.find({
            $or: [{ 'user1.id': req.user?._id }, { 'user2.id': req.user?._id }]
        })

        // console.log(potentialMatches)

        const filteredMatches = potentialMatches.map(match => {
            if (match.user1.id.toString() === req.user?._id.toString()) {
                // console.log('true')
                // console.log(match.user1.id.toString(), ' === ', req.user?._id.toString())
            return { _id: match._id, user: match.user2.id, yourStatus: match.user1.status, matchStatus: match.user2.status};
            } else {
                // console.log('false')
                // console.log(match.user1.id.toString(), ' !== ', req.user?._id.toString())
            return { _id: match._id, user: match.user1.id, yourStatus: match.user2.status, matchStatus: match.user2.status };
            }
        });




 // for (let i = 0; i < filteredMatches.length; i++) {

        //     try {
        //       const populatedUser = await User.findById(filteredMatches[i].user)
        //         .populate('skills_collection')
        //         .populate('skills_wanted');
        //       filteredMatches[i] = populatedUser;
        //     } catch (err) {
        //       console.error(err);
        //       // Handle the error appropriately
        //     }
        //   }



        // Respond with the matches
        
        
        for (const match of filteredMatches) {
            try {
                const populatedUser = await User.findById(match.user)
                    .select(["-password", "-refresh_token"])
                    .populate('skills_collection')
                    .populate('skills_wanted')
                    .lean();


                match.user = populatedUser;
            } catch (err) {
                console.error(err);
                // Handle the error appropriately
            }
        }

        console.log(filteredMatches)



    
        res.status(200).json(new APIResponse(200, filteredMatches, "Matches fetched successfully"));

    } catch (error) {
        res.status(400).json(new APIError(400, error.message))

    }
};



// Controller function to update match status
const requestForCollab = async (req, res) => {
    try {
        // Find the match by ID and update its status
        const match = await Matches.findById(req.params.matchId)
        // If match is not found
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

   

        const updateMatch = async () => {
            if(match.user1.id.toString() === req.user?._id.toString()){
            // console.log("true")
            // console.log(match.user1.id.toString() + " === " + req.user?._id.toString())
            match.user1.status = req.body.status
            await match.save()

                 return  {
                    _id: match._id,
                    user: match.user2.id,
                    yourStatus: match.user1.status,
                    matchStatus: match.user2.status
                }
        }else{
            // console.log("false")
            // console.log(match.user1.id.toString(), " !== ", req.user?._id.toString())
            match.user2.status = req.body.status

            await match.save()

                return  {
                    _id: match._id,
                    user: match.user1.id,
                    yourStatus: match.user2.status,
                    matchStatus: match.user1.status
                }

        }



        }

        const updatedMatch = await updateMatch();

        console.log(updatedMatch)


        // Respond with the updated match
        res.status(200).json(new APIResponse(200, updatedMatch, "Match Status Updated Successfully"));
    } catch (error) {
        res.status(error.statusCode).json(new APIError(error.statusCode, error.message))

    }
}




export {findMatches, getMatchesForUser, requestForCollab}