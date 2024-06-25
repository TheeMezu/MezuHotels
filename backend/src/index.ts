import express, { Request, Response } from "express"
import cors from "cors"
import "dotenv/config"
import mongoose from "mongoose"
import userRoutes from "./routes/users"
import authRoutes from "./routes/auth"
import cookieParser from "cookie-parser"
import path from "path"


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

app.listen(7000, () => {
    console.log("server running on localhost:7000");
})