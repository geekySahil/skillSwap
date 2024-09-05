import { v2 as cloudinary } from "cloudinary"
import fs from 'fs'
import dotenv from 'dotenv';


dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath){
            console.log("localpath does not exist")
            return null
        }
        console.log(`Uploading file to Cloudinary: ${localFilePath}`);
        const response = await cloudinary.uploader.upload(localFilePath, {resource_type: "auto"})
        console.log(`Upload successful: ${JSON.stringify(response)}`);

        fs.unlinkSync(localFilePath)
        console.log(`Local file deleted: ${localFilePath}`);
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null
    }
}

export {uploadOnCloudinary}