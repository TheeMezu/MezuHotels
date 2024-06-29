import express, { Request, Response } from "express"
import cors from "cors"
import "dotenv/config"
import mongoose from "mongoose"
import userRoutes from "./routes/users"
import authRoutes from "./routes/auth"
import myHotelRoutes from "./routes/my-hotels"
import hotelRoutes from "./routes/hotels"
import cookieParser from "cookie-parser"
import path from "path"
import {v2 as cloudinary} from "cloudinary"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.COUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// to connect to our test database we added a new script e2e so we can have
// 2 different databases so we can have a consistant database for testing 
// to make sure our code works as expected
mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string)

const app = express()

// to make the backend use the cookieparser so we can get the token
app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({extended: true}))

// this means that our api will only accept requests from this url and it must 
// include a cookie in the request 
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))

// so we can have only 1 file when deploying which is not done during development
app.use(express.static(path.join(__dirname, "../../frontend/dist")))

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/my-hotels", myHotelRoutes)
app.use("/api/hotels", hotelRoutes)

// as it is a protected route we have to specify for 
app.get("*", (req: Request, res:Response)=>{
    res.sendFile(path.join(__dirname, "../../fronted/dist/index.html"))
})

app.listen(7000, () => {
    console.log("server running on localhost:7000");
})