import express, {Request, Response} from "express";
import User from "../models/user";
import jwt from "jsonwebtoken"
import { check, validationResult } from "express-validator";

const router = express.Router()

router.post(
    "/register",
    [
        check("firstName", "First Name is required").isString(),
        check("lastName", "Last Name is required").isString(),
        check("email", "Email is required").isEmail(),
        check("password", "Password with 6 or more characters required").isLength({
            min: 6,
        }),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array() });
        }
        try {
            let user = await User.findOne({
                email: req.body.email,
            });

            if (user) {
                return res.status(400).json({ message: "User already exists" });
            }

            user = new User(req.body);
            await user.save();

            // jwt needs to know what will it encrypt and also the secret key that will
            // help encrypting it, and we also have an expiry day 
            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET_KEY as string,
                { expiresIn: "1d" }
            );
            // this is how we send the cookie
            res.cookie(
                "auth_token",
                token,
                {
                    // means it's http only and only available on a server
                    httpOnly: true,
                    // only accepts cookies in an https 
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 86400000,
                },
            );
            // we don't need to send anything to the frontend 
            return res.status(200).send({ message: "User registered OK" });
        } catch (error) {
            console.log(error);
            res.status(500).send({ message: "Something went wrong" });
        }
    }
);

export default router

// we first get the user information and then we need to encrypt the password
// and create a jwt before saving it to the backend 

// we created a the hashed password in the user model 

// user.id is the string virtual presentation of user_id from mongoDb 