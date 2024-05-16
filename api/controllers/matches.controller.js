import mongoose from "mongoose";
import { APIError } from "../utils/apiError.js";
import { APIResposnse } from "../utils/apiResponse.js";
import User from "../models/user.model.js";
import Skills from "../models/skills.model.js";
import Matches from '../models/matches';
import User from '../models/user'; // Assuming you have a User model
import { asyncHandler } from "../utils/asyncHandler";

const findMatches = asyncHandler(async(req, res)=>  {

    const userId = req.user?._id

    try {
        // Get all users who have skills or interests
        const usersWithSkills = await User.find({
            $or: [
                { skills_collection: { $exists: true, $ne: [] } }, //skills
                { skills_wanted: { $exists: true, $ne: [] } } // interests
            ]
        });

        // Iterate through users to find matches
        for (let i = 0; i < usersWithSkills.length; i++) {
            const currentUser = usersWithSkills[i];
            const otherUsers = usersWithSkills.filter(user => user._id.toString() !== currentUser._id.toString());

            for (let j = 0; j < otherUsers.length; j++) {
                const potentialMatch = otherUsers[j];
                const commonSkills = currentUser.skills_collection.filter(skill =>
                    potentialMatch.skills_wanted.includes(skill)
                );

                // If there are common skills, create a match
                if (commonSkills.length > 0) {
                    // Check if a match already exists between these users
                    const existingMatch = await Matches.findOne({
                        $or: [
                            { $and: [{ user1_id: currentUser._id }, { user2_id: potentialMatch._id }] },
                            { $and: [{ user1_id: potentialMatch._id }, { user2_id: currentUser._id }] }
                        ]
                    });

                    const matches = []

                    if (!existingMatch) {
                        // Create a new match
                        const match = new Matches({
                            user1_id: currentUser._id,
                            user2_id: potentialMatch._id,
                            status: 'pending'
                        });
                        await match.save();
                         // Add the match to the matches array
                        matches.push(match);
                    }
                }
            }
        }
              

        // const matches = await Matches.find(
        //     {
        //         $or: [{user1_id: userId}, {user2_id: userId}]
        //     }
        // )

        res.status(200).json(new APIResposnse(200,matches, "Here are Your matches" ))

    } catch (error) {
        console.error('Error finding matches:', error);
    }
})   

//////////////////////////////////////////////////////////////////////////////////


// matchController.js

const Match = require('../models/Match');

// Controller function to get matches for a user
const getMatchesForUser = async (req, res) => {
    try {
        // Find matches where the user is either user1 or user2
        const matches = await Match.find({
            $or: [{ user1_id: req.user?._id }, { user2_id: req.user?._id }]
        });

        // Respond with the matches
        res.json(matches);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getMatchesForUser
};


// Controller function to update match status
const updateMatchStatus = async (req, res) => {
    try {
        // Find the match by ID and update its status
        const match = await Matches.findByIdAndUpdate(req.params.matchId, { status: req.body.status }, { new: true });

        // If match is not found
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Respond with the updated match
        res.json(match);
    } catch (error) {
        console.error
    }
}



export {findMatches, getMatchesForUser, updateMatchStatus}
