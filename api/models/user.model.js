import mongoose, { Schema } from "mongoose"


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
            ref: "Skills",
            // required: true
        },
        skills_wanted: [{
            type: [Schema.Types.ObjectId],
            ref: "Skills"
            // required: true
        }],
        availability: {
            type: Date,
            default: Date.now
            // required: true
        },
        location: {
            type: String,
            required: true
        },
        profilePicture: {
            type: String,
            required: true
        },
        reviews: {
            type: [Schema.Types.ObjectId],
            ref: "Feedback",
            // required: true
        },
        refresh_token: {
            type: String
        }
    }, { timestamps: true }
)

userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(password, 10)
    next();
})

userSchema.method.isPasswordCorrect = async function () {
    return await bcrypt.compare(password , this.password)
}

userSchema.method.generateAccessToken = function () {
    jwt.sign(
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

userSchema.method.generateRefreshToken = function(){
    jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("User", userSchema)

export default User