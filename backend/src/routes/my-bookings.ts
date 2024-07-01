import express, { Request, Response } from "express";
import verifyToken from "../middleware/auth";
import Hotel from "../models/hotel";
import { HotelType } from "../shared/types";

const router = express.Router();

// /api/my-bookings
router.get("/", verifyToken, async (req: Request, res: Response) => {
    try {
        // this will return us all the hotels objects along with all the bookings
        // array inside an array that contain the user id

        //$in wouldnt work here as bookings element is a nested array of objects 
        // {
        //     "name": "Hotel A",
        //     "bookings": [
        //       { "userId": "123", "date": "2023-01-01" },
        //       { "userId": "456", "date": "2023-01-02" }
        //     ]
        // }
        const hotels = await Hotel.find({
        bookings: { $elemMatch: { userId: req.userId } },
        });

        // since we are getting all the bookings from a specific hotel we 
        // should filter and only get the ones that has our userId 
        // so if the userId match we keep that booking
        const results = hotels.map((hotel) => {
            const userBookings = hotel.bookings.filter(
                (booking) => booking.userId === req.userId
            );

            const hotelWithUserBookings: HotelType = {
                ...hotel.toObject(),// mongoose that contains the hotels
                bookings: userBookings, 
                // overriding bookings as it contains different users bookings as well
            };

            return hotelWithUserBookings;
        });

        res.status(200).send(results);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to fetch bookings" });
    }
});

export default router;