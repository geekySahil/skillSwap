import mongoose from "mongoose";
import { APIError } from "../utils/apiError.js";
import { decrypt } from "dotenv";
import jwt from "jsonwebtoken"


const verifyJWT = async (req, res, next) => {
    const token = await req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
    // console.log(token)
    

    

    try {
        
        if(!token){
            throw new APIError(401, "user not signed in")
            // res.status(401).json(new APIError(401, `user not signed in`))

        }


        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // console.log(decodedToken)
    
        if(!decodedToken){
            throw new APIError(401, "user does not exist ")
        }
    
        req.user = decodedToken
    
        next()
    } catch (error) {
        res.status(401).json(new APIError(401, `Error Occured: ${error.message}`))
    }


}

export { verifyJWT }