import mongoose from "mongoose";
import { APIError } from "../utils/apiError";
import { decrypt } from "dotenv";


const verifyJWT = async (req, res, next) => {
    const accessToken = req.cookies.access_token

    if(!accessToken){
        throw new APIError(401, "user not signed in ")
    }

    try {
        const decodedToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    
        if(!decodedToken){
            throw new APIError(401, "user does not exist ");
    
        }
    
        req.user = decodedToken
    
        next()
    } catch (error) {
        throw new APIError(401, `Error Occured: ${error}`)
    }


}

export { verifyJWT }