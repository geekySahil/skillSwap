import mongoose, { Schema } from "mongoose"
import Skills from "./skills.model.js"
import Feedback from "./feedback.model.js"
import  jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"


const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true,
        },
        skills_collection: {
            type: [Schema.Types.ObjectId],
            ref: Skills.modelName,
            // required: true
        },
        skills_wanted: {
            type: [Schema.Types.ObjectId],
            ref: Skills.modelName
            // required: true
        },
        availability: {
            type: Date,
            default: Date.now
            // required: true
        },
        location: {
            type: String,
            // required: true
        },
        profilePicture: {
            type: String,
            required: true
        },
        reviews: {
            type: [Schema.Types.ObjectId],
            ref: Feedback.modelName,
            // required: true
        },
        refresh_token: {
            type: String
        }
    }, { timestamps: true }
)

userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
        _id: this._id,
        username: this.username,
        email: this.email

        }
        , process.env.ACCESS_TOKEN_SECRET, 
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

userSchema.statics.findByUsername = async function(username) {
    return await this.find({ username: new RegExp(username, 'i') }).select('-refresh_token -password');
};


const User = mongoose.model("User", userSchema)

export default User