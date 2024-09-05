import mongoose from "mongoose";
import  {APIError}  from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import {APIResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const generateRefreshAndAccessToken = async(userId) => {
   try {
     const user = await User.findById(userId)

     console.log(user)

     if(!user){
        throw new APIError(401, "user not found")
     }
     console.log("generating access token")
     const accessToken = await user.generateAccessToken()
     console.log("access token generated")
     console.log("generating refresh token")


     const refreshToken = await user.generateRefreshToken()
     console.log("refresh token generated ")
     
 
     user.refresh_token = refreshToken
 
     await user.save({validateBeforeSave: false})
 
 
     return {accessToken, refreshToken}
 
   } catch (error) {
     throw new APIError(401, "something went wrong while generating tokens")
   }
    
}

//////////////////////////////////////////////////////////////////////////////////

const registerUser = asyncHandler( async(req, res, next) => {
    const {username, email , password, profilePicture, location} = req.body

    console.log(username , email , password, profilePicture , location)

    try {
        if (
            [profilePicture, email, username, password].some((field) => field?.trim() === "")
        ) {
            throw new APIError(400, "All fields are required")
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
            throw new APIError(401, "profile is required to signup");
        }
    
        const cloudinary = await uploadOnCloudinary(profileLocalPath);
    
        // console.log(cloudinary)
    
    
        if(!cloudinary){
            throw new APIError(500, "Failed to Upload ");
        }
    
        // console.log(cloudinary.secure_url)
    
    
        const createdUser = await User.create({
            username: username,
            email: email,
            password: password,
            profilePicture: cloudinary.secure_url,
            location: location || "auto"
           
        })
    
    
        if(!createdUser){
            throw new APIError(500 , "failed to create user");
        }
    
        // console.log(createdUser.username)
    
        await createdUser.save({select: ["-password", "-refreshToken"]})
    
        const {accessToken, refreshToken} = await generateRefreshAndAccessToken(createdUser._id)
    
        console.log(createdUser._id)

        // console.log("accessToken: " + accessToken, "refreshToken: " + refreshToken)
    
        const options = {
            httpOnly: true,
            secure: false,
            SameSite: "none",
            maxAge: 24 * 60 * 60 * 1000
            
        }
    
        
    
        res.status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new APIResponse(201, createdUser, "signed up successfully"))
    
    } catch (error) {
        res.status(error.statusCode).json(new APIError(error.statusCode, error.message))
    }

})
////////////////////////////////////////////////////////////////////////////////////////
const loginUser = asyncHandler(async(req, res, next) => {
    const {email, password} = req.body;

try {
        if(!email || !password){
            throw new APIError(401, "Both fields are required ");
        }
    
        const user = await User.findOne({email})
    
        if(!user){
            throw new APIError(401, "user does not exist");
        }
    
        const passwordCheck = await user.isPasswordCorrect(password)
    
        if(!passwordCheck){
            throw new APIError(401, "incorrect password")
        }
    
        
        const {accessToken, refreshToken} = await generateRefreshAndAccessToken(user._id)
    
        const loggedInUser = await User.findById(user._id).select("-password -refresh_token")
    
        const options = {
            httpOnly: true,
            secure: false,
            SameSite: "none",
            maxAge: 24 * 60 * 60 * 1000
            
        }
    
        res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options )
        .json(
            new APIResponse(200, {accessToken, refreshToken, loggedInUser}, "user logged in successfully!")
    
            )
    } catch (error) {
        res.status(error.statusCode).json(new APIError(error.statusCode, error.message))
    }


})
//////////////////////////////////////////////////////////////////////////////////////////
const logoutUser = asyncHandler(async(req, res, next) => {
 try {
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
       .json(200, "Logged Out Successfully")
 } catch (error) {
    res.status(401).json(new APIError(401, `Error: ${error.message}`))
 }
})

//////////////////////////////////////////////////////////////////////////////////////////
const refreshAccessToken = asyncHandler(async(req, res, next) => {
    console.log('REFRESH ACCESS TOKEN API GOT HIT')

    
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken


        console.log("incoming refresh token " + incomingRefreshToken)

        if(!incomingRefreshToken){
            throw new APIError(401, "unauthorized request")
        }

        try {
            const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
            console.log("verified")
            
            const user = await User.findById(decodedToken?._id);
            console.log("user: " + user)
            if(!user){
                throw new APIError(401, "invalid refresh token")
            }

            if(incomingRefreshToken !== user?.refresh_token){
                throw new APIError(401, "Token is expired or used")
            }
    
            const {accessToken, refreshToken} = await generateRefreshAndAccessToken(user._id)
    
            res.status(200)
            .cookie("accessToken", accessToken, {httpOnly: true , secure : true })
            .cookie("refreshToken", refreshToken, {httpOnly: true , secure : true })
            .json(new APIResponse(201, {accessToken, refreshToken}, "Access Token regenerated successfully"))
        } catch (error) {
            throw new APIError(401, "Error: " + error?.message || "Invalid Refresh Token")
        }
})

///////////////////////////////////////////////////////////////////////////////////////
const getCurrentUser = asyncHandler(async(req, res) => {
        return res
        .status(200)
        .json(new APIResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
        const {username, email,password, location} = req.body

        try {
            if(!req.user){
                throw new APIError(401, "Unauthorised access")
            }
    
            if(!email && !location && !password && !username){
                throw new APIError(401,"Atleast One field is required")
            }
    
            const newDetails = await User.findByIdAndUpdate(req.user._id, {
            
                    $set:{
                    username: username,
                    password: password,
                    email :email,
                    location: location
                }
            
            },{new: true}).select('-password')
    
            if(!newDetails){
                throw new ApiError(401, "Something went wrong while updating user details")
            }
    
            res.status(201).json(new APIResponse(201, newDetails, "account details updated successfully"))
        } catch (error) {
            res.status(401).json(new APIError(error.statusCode, `Error: ${error.message}`))
        }

        
})
//////////////////////////////////////////////////////////////////////////////////////////////

const changeProfilePicture = asyncHandler(async(req, res) => {
        const userId = req.user?._id
        const newProfileLocalPath= req.file?.path

        try {
            if(!newProfileLocalPath){
                throw new APIError(401, "Profile path is required")
            }
    
            const cloudinaryURL = await uploadOnCloudinary(newProfileLocalPath) //req.file?.path
    
            if(!cloudinaryURL){
                throw new APIError(401, "Failed to upload profile on clouudinary")
            }
    
    
            const user = await User.findByIdAndUpdate(userId, 
                {
                    profilePicture: cloudinaryURL.secure_url
                },
                {new: true}
            )
    
            if(!user){
                new APIError(401, "user not found")
            }
    
            res.status(201).json(new APIResponse(201, user, "Profile updated successfully"))
        } catch (error) {
            res.status(error.statusCode).json(new APIError(error.statusCode , `Error: ${error.message}`))
        }





})

///////////////////////////////////////////////////////////////////////////
const changePassword = asyncHandler(async(req, res) => {
        const {oldPassword, newPassword} = req.body

        try {
            const user = await User.findById(req.user?._id);
    
            const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
            if(!isPasswordCorrect){
                throw new APIError("Invalid Old password")
            }
    
            user.password = newPassword
    
            await user.save({validateBeforeSave: false})
    
            return res.status(200).json(new APIResponse(200, {}, "password changed successfully"))
        } catch (error) {
            return res.status(error.statusCode).json(new APIError(error.statusCode, "Error: " + error.message))
        }
})

const deleteUserAccount = asyncHandler(async(req, res) => {

    const user = await User.findByIdAndDelete(req.user._id)

    const options = { 
        httpOnly: true,
        secure: true
    }

    res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APIResponse(200, user,  "account deleted Successfully"))
})

const searchUserByName = asyncHandler(async(req, res) => {
    const { username } = req.params;

    try {
        const users = await User.findByUsername(username)
        if (users && users.length > 0) {
            return res.status(200).json(users);
        } else {
            return res.status(404).json({ message: "No users found" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Error searching for users", error });
    }
})


    

export {searchUserByName, registerUser, loginUser, logoutUser, refreshAccessToken, changeProfilePicture,updateAccountDetails, getCurrentUser, changePassword, deleteUserAccount}