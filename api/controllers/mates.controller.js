import { APIError } from '../utils/apiError.js';
import { APIResponse } from '../utils/apiResponse.js';
import User from '../models/user.model.js';
import Mates from '../models/mates.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import Matches from '../models/matches.model.js';
import path from 'path';
import { setNotification } from './notifications.controller.js';

const createNewMate = asyncHandler(async(req, res, next) => {

    try {
        const { matchRef, user1, user2 } = req.body;

        // Validate match reference
        const match = await Matches.findById(matchRef);

        if (!match) {
            throw new APIError(404, 'Match not found');
        }
    
        // Validate users
        const user1Exists = await User.findById(user1);
        const user2Exists = await User.findById(user2);
    
        if (!user1Exists || !user2Exists) {
            throw new APIError(404, 'One or both users not found');
        }
    
        // Check if a mate relationship already exists between these users
        const existingMate = await Mates.findOne({
            $or: [
                { user1: user1, user2: user2 },
                { user1: user2, user2: user1 }
            ]
        });
    
        if (existingMate) {
            // throw new APIError(204, 'Mate relationship already exists between these users');
            return
        }
    
        // Create a new mate
        // const newMate = new Mates({
        //     matchRef,
        //     user1,
        //     user2,
        //     messages: [],
        //     meetings: []
        // })

            
        const newMate = await Mates.create({
            matchRef: matchRef,
            user1: user1,
            user2: user2,
            messages: [],
            meetings: [],
            notifications: []
        })


        await newMate.populate({path: 'user1',select: '-password -refresh_token'
        })

        await newMate.populate({path: 'user2', select: '-password -refresh_token'})

        // console.log('newmate created:', newMate);


        
      
        res.status(201).json(new APIResponse(201, newMate, 'Mate created successfully'));
    } catch (error) {
        console.log(error)
        res.status(error.statusCode || 500).json(new APIError(error.statusCode || 500, error.message || "failed"))
    }
}) 

const getAllMates = async (req, res, next) => {
    try {
        const mateDocuments = await Mates.find({
            $or: [{ user1: req.user._id }, { user2: req.user._id }],
        }).populate('user1 user2')


        // if (!mateDocuments || mateDocuments.length === 0) {
        //     throw new APIError(404, "Mates not found");
        // }
 
        // console.log('mateDocuments', mateDocuments)



        const mates = mateDocuments?.map(mate => {
            if (mate.user1.id === req.user._id) {
                // console.log("true", mate.user2.id.toString())


                // console.log(mate.user1.id, " === ", req.user._id)
            return  {
                _id: mate._id,
                user: mate.user2,
                matchRefId: mate.matchRef,
                messages: mate.messages,
                meetings: mate.meetings,
                notifications: mate.notifications
              }
            } else {
                // console.log("false", mate.user2.id.toString())
                // console.log(mate.user1.id, " !== ", req.user._id)
       

            return {
                _id: mate._id,
                user: mate.user1,
                matchRefId: mate.matchRef,
                messages: mate.messages,
                meetings: mate.meetings,
                notifications: mate.notifications
               
              }
            }
        })

        // console.log("filteredMates" , mates)

     
       



        res.status(200).json(new APIResponse(200, mates, "Mates fetched successfully"));
    } catch (error) {
        console.log(error)
        res.status(error.statusCode || 500).json(new APIError(error.statusCode || 500, error.message || 'Failed to fetch mates'));
    }
};

const saveMessageToDatabase = async (req, res, next) => {
    try {
       
        const {newMessage} = req.body
        
        if(!newMessage) throw new APIError(404, 'falied to find message')

        const mateWithAddedMessage = await Mates.findByIdAndUpdate(req.params.mateId, {
            $push:{messages: newMessage}
        }, {new: true})


        if(!mateWithAddedMessage) throw new APIError(404 ,"failed to save message")

        res.status(201).json(new APIResponse(201, mateWithAddedMessage.messages[mateWithAddedMessage.messages.length - 1],"messages saved"));
    } catch (error) {
        res.status(error.statusCode || 500).json(new APIError(error.statusCode || 500, error.message));
    }
};

const getAllMessages = async (req, res, next) => {
    try {
        const mateId = req.params.mateId;

        // Find the mate and populate the sender field in messages
        const mate = await Mates.findById(mateId)
        if (!mate) {
            throw new APIError(404, 'Mate not found');
        }

        // Extract all messages
        const allMessages = mate.messages;

        res.json(new APIResponse(200, allMessages, 'Messages fetched successfully'));
    } catch (error) {
        next(new APIError(error.statusCode || 500, error.message || 'Failed to fetch messages'));
    }


}

const deleteMessage = async(req, res, next) => {
    const mateId = req.params.mateId
    const messageId = req.body.messageId

    // console.log(mateId, 'messageId', messageId)

    try {
       const deleteResponse =  await Mates.findByIdAndUpdate(mateId, 
        {
            $pull: { messages: { _id: messageId } }
        }, {new: true})

        if(!deleteResponse){
            throw new APIError(400, 'failed to delete message')
        }

        // console.log(deleteResponse)

        res.status(200).json(new APIResponse(200, deleteResponse, "message deleted successfully"))
    } catch (error) {
        res.status(error.statusCode || 500).json(new APIError(error.statusCode || 500, error.message || "failed"))
    }
}


// const scheduleMeeting = async (req, res, next) => {
//     try {
//         const mate = await Mate.findById(req.params.mateId);
//         if (!mate) throw new APIError(404, 'Mate not found');

//         const newMeeting = {
//             topic: req.body.topic,
//             date: req.body.date
//         };

//         mate.meetings.push(newMeeting);
//         await mate.save();
//         res.json(new APIResponse(201, newMeeting));
//     } catch (error) {
//         next(new APIError(error.statusCode || 500, error.message));
//     }
// };

const unmate = async (req, res) => {
    // console.log(req.params.mateId)
    try {
       const deleteResponse =  await Mates.findOneAndDelete({_id:req.params.mateId});

       const deleteResponseId = deleteResponse._id

       const match = await Matches.findById(deleteResponse.matchRef);

    //    console.log('matchRef', deleteResponse.matchRef)
        if (!match) {
            throw new APIError(401, 'Match not found' );
        }

        // Determine which user is the current user and update their status
        if (match.user1.id.equals(req.user._id)) {
            match.user1.status = 'pending';
        } else if (match.user2.id.equals(req.user._id)) {
            match.user2.status = 'pending';
        } else {
            throw new APIError(401, 'User is not part of this match' );
        } 

        // console.log('status1', match.user1.status, 'status2', match.user2.status)

        // Save the updated match
        await match.save();

        res.status(200).json(new APIResponse(200, deleteResponseId, 'Mate removed successfully'));
    } catch (error) {
        res.status(error.statusCode || 500).json(new APIError(error.statusCode || 500, error.message , "failed to delete"));
    }
};

const setMeeting = async (req, res) => {
    try {
        const { topic, time  } = req.body;
        const mateId = req.params.mateId

        const mate = await Mates.findById(mateId).populate('user1 user2');
        if (!mate) {
            return res.status(404).json({ message: 'Mate not found' });
        }

        // console.log('user1', mate.user1._id, 'user2', mate.user2._id)
        // console.log('userrr', req.user._id)

        const scheduledWith = mate.user1._id.equals(req.user._id) ? mate.user2._id : mate.user1._id;


        const meeting = {
            topic,
            time, 
            scheduledBy: req.user._id,
            scheduledWith: scheduledWith
        };

        // console.log(meeting)

        mate.meetings.push(meeting);

        await mate.save();

        // Create a notification for both users
        // await setNotification(mate, 'scheduled_meeting', `Meeting on ${topic} scheduled for ${time}`);

        res.status(200).json(new APIResponse(200, meeting, "meeting set successfully"));
    } catch (error) {
        res.status(error.statusCode || 500).json(new APIError(error.statusCode || 500 , error.message || "failed to set meeting"));
    }
};

const cancelMeeting  = async (req, res) => {
    try {
        const {meetingId} = req.body;
        const mateId = req.params.mateId

        // console.log("Mate ID:", mateId);
        // console.log("Meeting ID:", meetingId);

        const mate = await Mates.findByIdAndUpdate(
            mateId,
            {
                $pull: { meetings: { _id: meetingId } }
            },
            { new: true } // This option ensures the updated document is returned
        );

        if (!mate) {
            return res.status(404).json(new APIError(404, 'Mate not found'));
        }

        res.status(200).json(new APIResponse(200, mate.meetings, 'meeting cancelled'));
    } catch (error) {
        res.status(error.statusCode || 500).json(new APIError(error.statusCode || 500, error.message || 'failed'));
    }
};

const getAllMeetings = async (req, res) => {
    const {mateId} = req.params

    console.log('GET ALL MEETINGS', mateId)

    try {

    console.log('GET ALL MEETINGS 0')

    const mate = await Mates.findById(mateId)
    .populate({
        path: 'meetings.scheduledBy meetings.scheduledWith', // Path to the field you want to populate
        select: 'username email',      // Fields you want to retrieve
    });

    console.log('GET ALL MEETINGS 1', mate)


        if (!mate) {
            throw new APIError(404, 'Mate not found');
        }

    console.log('GET ALL MEETINGS 2')


        console.log('meetings ', mate.meetings)

        const meetings = mate.meetings


        res.status(200).json(new APIResponse(200, meetings, 'meetings fetched successfully'))
       


    } catch (error) {
        res.status(error.statusCode || 500).json(new APIError(error.statusCode || 500, error.message || 'failed to fetch'))
        
    }
}

const fetchMeetingsForAllMates = async (req, res) => {
    const userId = req.params.userId

    try {
        const mates = await Mates.find({
            $or: [{ user1: userId }, { user2: userId }]
        }).populate('user1 user2 meetings.scheduledBy meetings.scheduledWith');
         
        

        const meetings = mates.flatMap(mate => mate.meetings );


        //  console.log(meetings);

         if(!meetings){
            throw new APIError(404, "meetings not found ")
         }

         res.status(200).json(new APIResponse(200, meetings, 'meetings found successfully'))
    } catch (error) {
        res.status(error.statusCode || 500).json(new APIError(error.statusCode || 500, error.statusCode || 'Failed to find meetings successfully'))
        throw error;
    }
};





export {
    getAllMeetings,
    createNewMate,
    getAllMates,
    saveMessageToDatabase,
    getAllMessages,
    deleteMessage,
    unmate,
    cancelMeeting,
    setMeeting,
    fetchMeetingsForAllMates
};
