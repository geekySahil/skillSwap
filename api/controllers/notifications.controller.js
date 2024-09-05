import { APIError } from '../utils/apiError.js';
import { APIResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import Notifications from '../models/notifications.model.js';





const setNotification = async (req, res) => {
    try {

        const {type, to, note} = req.body

        const notification = new Notifications({
            type,
            from: req.user._id,
            to,
            note
        })

        await notification.save({validateBeforeSave: false})

        res.status(200).json(new APIResponse(200, notification, 'notification set successfully'))

    } catch (error) {
        res.status(error.statusCode || 500).json(new APIError(error.statusCode || 500, ' notification failed '))
    }
};

const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        console.log('userId', userId)
        
        // Fetch notifications
        const notifications = await Notifications.find({
            $or: [
                { type: 'scheduled_meeting', $or: [{ to: userId }, { from: userId }] },
                { type: 'new_message', to: userId },
                {type: 'review', to: userId},
                {type: 'request', to: userId}
            ]
        }).populate('from', 'username');

        // Respond with the notifications
        res.status(200).json(new APIResponse(200, notifications, "Notifications fetched successfully"));

        // Delete the fetched notifications
        await Notifications.deleteMany({
            _id: { $in: notifications.map(notification => notification._id) }
        });

        console.log('DONE....')

    } catch (error) {
        res.status(error.statusCode || 500).json(new APIError(error.statusCode || 500, error.message || 'Failed to fetch notifications'));
    }
}



const removeNotification = async (req, res) => {

    try {
        const {type} = req.body
        const notificationId = req.params.notificationId

        let delResponse

        if(type ==='new_message'){
            delResponse = await Notifications.deleteMany({to:req.user._id, type: type})
        }else{
            delResponse = await Notifications.findByIdAndDelete(notificationId)
        }


        console.log('all good up untill here')

        console.log('delResponse ', delResponse)



        if (!delResponse) {
            throw new APIError(404, 'failed to delete notification');
        }

        console.log('sab changa si')

        res.status(200).json(new APIResponse(200, {}, 'notification removed successfully'));
    } catch (error) {
        res.status(error.statusCode || 500).json(new APIResponse(error.statusCode || 500, error.message || 'failed to remove'));
    }
};

export {
    setNotification, removeNotification, getNotifications
}