import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Hotel from "../models/hotel";
import verifyToken from "../middleware/auth";
import { body } from "express-validator";
import { HotelType } from "../shared/types";

const router = express.Router();

// defining a multer storage to handle multiple types of data 
// also will boost the performance as the memory storage is quite fast 
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

router.post(
    "/",
    verifyToken,
    [
        body("name").notEmpty().withMessage("Name is required"),
        body("city").notEmpty().withMessage("City is required"),
        body("country").notEmpty().withMessage("Country is required"),
        body("description").notEmpty().withMessage("Description is required"),
        body("type").notEmpty().withMessage("Hotel type is required"),
        body("pricePerNight")
            .notEmpty()
            .isNumeric()
            .withMessage("Price per night is required and must be a number"),
        body("facilities")
            .notEmpty()
            .isArray()
            .withMessage("Facilities are required"),
    ],// since it is an array of 6 images that the frontend will send it 
      // in a form called imageFiles and then multer will add req.file ith request
    upload.array("imageFiles", 6), async (req: Request, res: Response) => {
        try {
            const imageFiles = req.files as Express.Multer.File[];
            const newHotel: HotelType = req.body;

            const imageUrls = await uploadImages(imageFiles);

            newHotel.imageUrls = imageUrls;
            newHotel.lastUpdated = new Date();
            newHotel.userId = req.userId;

            const hotel = new Hotel(newHotel);
            await hotel.save();

            // we dont really need to send back hotel but its good 
            // for the frontend to know that it was successful
            res.status(201).send(hotel);
        } catch (e) {
            console.log(e);
            res.status(500).json({ message: "Something went wrong" });
        }
    }
);

// we map because cloudinary accepts 1 image per upload 
async function uploadImages(imageFiles: Express.Multer.File[]) {
    const uploadPromises = imageFiles.map(async (image) => {
        const b64 = Buffer.from(image.buffer).toString("base64");
        let dataURI = "data:" + image.mimetype + ";base64," + b64;
        const res = await cloudinary.v2.uploader.upload(dataURI);
        return res.url;
    });

    // we do that so we wait for all the image urls before we send back 
    // the urls 
    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
}

export default router;