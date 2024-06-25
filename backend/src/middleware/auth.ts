import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            userId: string;
        }
    }
}

// here we are verifying the existance of the token and also its properties 
// ie expiry etc 
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    // this is how we access the cookie 
    const token = req.cookies["auth_token"];
    if (!token) {
        return res.status(401).json({ message: "unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
        req.userId = (decoded as JwtPayload).userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: "unauthorized" });
    }
};

export default verifyToken;


// When a user logs in or signs up on the server, a JSON Web Token (JWT) is generated 
// containing essential user information, such as the userId. This token is then 
// securely signed using a server-side secret key. Upon successful authentication, 
// the server sends this token back to the client, typically stored in a secure 
// location like a cookie. When the user navigates to a protected route, such as 
// the home page, the client includes this token in the request headers or cookies.
// On the server side, the verifyToken middleware retrieves the token from the request
// cookies and verifies its authenticity using jwt.verify(), matching it against the 
// same secret key used during token creation. If the token's signature is valid, the 
// middleware decodes the token and extracts the userId from its payload. 
// This extracted userId is then attached to the request object (req.userId) for 
// subsequent request handling. If the token is tampered with, expired, or otherwise 
// invalid, the verification fails, triggering a 401 Unauthorized response. 
// This robust process ensures that only authenticated users with valid tokens can 
// access protected resources, maintaining security and user privacy throughout the 
// application.