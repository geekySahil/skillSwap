import express from 'express'
import dotenv from "dotenv"
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import userRouter from './routes/user.routes.js'


dotenv.config()


const app = express()

app.use(cookieParser())
app.use(bodyParser.json())


mongoose.connect(process.env.MONGODB_URI, {
    
}).then(()=> {
    console.log("Connected to Database")
}).catch((error)=> {
    console.log("Error connecting to database" + error);
})

app.use('/api/v1/user', userRouter)
const port = process.env.PORT

app.listen(port, (req, res) => {
    console.log(`App is running on port ${port}`)
})

export default app

//n4cKKFAYbHvE4ZF5
//mongodb+srv://ansari24sahil:<password>@cluster3.j2jtnxn.mongodb.net/