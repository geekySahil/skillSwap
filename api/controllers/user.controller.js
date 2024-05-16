import mongoose from "mongoose";
import { APIError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import {APIResponse} from "../utils/apiResponse.js"
import { JsonWebTokenError } from "jsonwebtoken";


const generateRefreshAndAccessToken = async(userId) => {
   try {
     const user = await User.findOne({userId})
     const accessToken = await user.generateAccessToken()
     const refreshToken = await user.generateAccessToken()
 
     user.refresh_token = refreshToken
 
     await user.save({validateBeforeSave: false})
 
 
     return {accessToken, refreshToken}
 
   } catch (error) {
     throw new ApiError(401, "something went wrong while generating tokens")
   }
    
}

//////////////////////////////////////////////////////////////////////////////////

const registerUser = asyncHandler( async(req, res, next) => {
    const {username, email , password, profilePicture, location} = req.body

    if (
        [profilePicture, email, username, password, location].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or:[{username}, {email}]
    });

    if(existedUser){
        throw new APIError(409, "user already exist")
    }

    const profileLocalPath = await req.file?.path

    console.log(profileLocalPath)

    if(!profileLocalPath){
        throw new APIError(401, "profile in required to signup");
    }

    const cloudinaryURL = await uploadOnCloudinary(profileLocalPath);

    if(!cloudinaryURL){
        throw new APIError(500, "Failed to Upload ");
    }

    const createdUser = await User.create({
        username: username,
        email: email,
        password: password,
        profilePicture: cloudinaryURL,
        location: location
       
    })


    if(!createdUser){
        throw new APIError(500 , "failed to create user");
    }

    await createdUser.save({select: ["-password" , "-refreshToken"]})

    res.status(201).json(new APIResponse(201, createdUser, "signed up successfully"))


})

const loginUser = asyncHandler(async(req, res, next) => {
    const {email , password} = req.body;

    if(!email || !password){
        throw new ApiError(401, "Both fields are required ");
    }

    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(401, "user does not exist");
    }

    const passwordCheck = await user.isPasswordCorrect(password)

    if(!passwordCheck){
        throw new ApiError(401, "incorrect password")
    }

    
    const {accessToken, refreshToken} = await generateRefreshAndAccessToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password", "-refresh_token")

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
    .cookie("refreshToken", refreshToken)
    .cookie("accessToken", accessToken)
    .json(
        new APIResponse(201, {accessToken, refreshToken, loggenInUser}, "user logged in successfully!")

    )


})

    const logoutUser = asyncHandler(async(req, res, next) => {
        await User.findByIdAndUpdate(req.user._id, {
            $unset:{
                refresh_token: 1
            }, 
            
        },
        {
          new: true      
        })

        const options = {
            httpOnly: true, 
            secure: true 
        }

        res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(201, "Logged Out Successfully")
    })

    const refreshAccessToken = asyncHandler(async(req, res, next) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if(!incomingRefreshToken){
            throw new ApiError(401, "unauthorized request")
        }

        try {
            const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
            
            const user = await User.findById(decodedToken?._id);
            
            if(!user){
                throw new ApiError(401, "invalid refresh token")
            }

            if(incomingRefreshToken !== user?.refresh_token){
                throw new ApiError(401, "Token is expired or used")
            }
    
            const {accessToken, newRefreshToken} = await generateRefreshAndAccessToken(user._id)
    
            res.status(200)
            .cookie("accessToken", accessToken)
            .cookie("refreshToken", newRefreshToken)
            .json(201, {accessToken, refreshToken: newRefreshToken}, "Access Token regenerated successfully")
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid Refresh Token")
        }
    })


    
    const getCurrentUser = asyncHandler(async(req, res) => {
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
    })

    const updateAccountDetails = asyncHandler(async(req, res) => {
        const [email, location] = req.body

        if(!req.user){
            throw new ApiError(401, "Unauthorised access")
        }

        if(!email || !location){
            throw new ApiError(401, "All fields are required")
        }

        const newDetails = await User.findByIdAndUpdate(req.user._id, {
        
                $set:{
                email :email,
                location: location
            }
        
        },{new: true}).select('-password')

        if(!newDetails){
            throw new ApiError(401, "Something went wrong while updating user details")
        }

        res.status(200).json(new APIResponse(200, newDetails, "account details updated successfully"))

        
    })


    const changeProfilePicture = asyncHandler(async(req, res) => {
        const userId = req.user?._id
        const newProfileLocalPath= req.file?.path

        if(!newProfileLocalPath){
            throw new ApiError(401, "Profile path is required")
        }

        const cloudinaryURL = await uploadOnCloudinary(newProfileLocalPath) //req.file?.path

        if(!cloudinaryURL){
            throw new ApiError(401, "Failed to upload profile on clouudinary")
        }


        const user = await User.findByIdAndUpdate(userId, 
            {
                profilePicture: cloudinaryURL
            },
            {new: true}
        )

        if(!user){
            new ApiError(401, "user not found")
        }

        res.status(201).json(new APIResponse(201, user, "Profile updated successfully"))





    })

    const changePassword = asyncHandler(async(req, res) => {
        const {oldPassword, newPassword} = req.body

        const user = await User.findById(req.user?._id);

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if(!isPasswordCorrect){
            throw new ApiError("Invalid Old password")
        }

        user.password = newPassword

        await user.save({validateBeforeSave: false})

        return res.status(200).json(new APIResponse(200, {}, "password changed successfully"))
    })


    

export {registerUser, loginUser, logoutUser, refreshAccessToken, changeProfilePicture, changePassword}