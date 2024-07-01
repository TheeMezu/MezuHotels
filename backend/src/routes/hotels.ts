import express, { Request, Response } from "express";
import Hotel from "../models/hotel";
import { BookingType, HotelSearchResponse } from "../shared/types";
import { param, validationResult } from "express-validator";
import Stripe from "stripe"
import verifyToken from "../middleware/auth";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_API_KEY as string)

router.get("/search", async(req:Request, res:Response)=> {
    try{

        const query = constructSearchQuery(req.query)

        // we can simplify this by using sort from mongoDb by 
        // writing Hotel.sort({[req.query.sortOption]: 1}), 
        // 1 means ascending order
        let sortOptions = {};
        switch (req.query.sortOption) {
            case "starRating":
                sortOptions = { starRating: -1 }; // descending
                break;
            case "pricePerNightAsc":
                sortOptions = { pricePerNight: 1 }; // ascending
                break;
            case "pricePerNightDesc":
                sortOptions = { pricePerNight: -1 };
                break;
        }
        const pageSize = 5;
        // we parse it as the query we get will be a string 
        const pageNumber = parseInt(req.query.page? req.query.page.toString(): "1")
        const skip = (pageNumber - 1) * pageSize
        const hotels = await Hotel.find(query).sort(sortOptions).skip(skip).limit(pageSize)

        const total = await Hotel.countDocuments(query)

        const response: HotelSearchResponse = {
            data: hotels,
            pagination: {
                total,
                page: pageNumber,
                pages: Math.ceil(total/ pageSize)
            }
        }

        res.json(response)
    } catch (error){
        console.log("error", error);
        res.status(500).json({message: "Something went wrong"})
    }
})

// public api as we are getting all the recent hotels 
router.get("/", async (req: Request, res: Response) => {
    try {
        const hotels = await Hotel.find().sort("-lastUpdated");
        res.json(hotels);
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ message: "Error fetching hotels" });
    }
});


router.get(
    "/:id",
    [param("id").notEmpty().withMessage("Hotel ID is required")],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
    
        const id = req.params.id.toString();
    
        try {
            const hotel = await Hotel.findById(id);
            res.json(hotel);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Error fetching hotel" });
        }
    }
);

// this smply calculates the total cost and then creates a payment intent 
// that creates a paymentIntent.client_secret that the frontend needs to 
// make the payment. in th frontend stripe sdk is the one that handles 
// the payment and not us 
router.post("/:hotelId/bookings/payment-intent", verifyToken, async(req: Request, res: Response) => {
    // we calculated that in the front end
    const {numberOfNights} = req.body
    // so we can the price of 1 night of that selected hotel
    const hotelId = req.params.hotelId 
    const hotel = await Hotel.findById(hotelId)

    if(!hotel){
        return res.status(400).json({message: "Hotel not found"})
    }

    // we do the total cost here incase the prices change 
    const totalCost = hotel.pricePerNight * numberOfNights

    // this gives us a paymentIntent.client_secret which we need to pass
    // to th frontend for payment 
    const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCost * 100,
        currency: "gbp",
        metadata: {
            hotelId,
            userId: req.userId
        }
    })

    if (!paymentIntent.client_secret) {
        return res.status(500).json({ message: "Error creating payment intent" });
    }

    // id is given from the paymentIntent
    const response = {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret.toString(),
        totalCost,
    };

    res.send(response);
})

// here we are simply confirming that payment was successful so we can add
// the booking into the database by checking multiple statements to make 
// sure its valid
router.post("/:hotelId/bookings", verifyToken, async (req: Request, res: Response) => {
    try {
        const paymentIntentId = req.body.paymentIntentId;

        // here we are getting the invoice for the payment
        const paymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntentId as string
        );

        if (!paymentIntent) {
            return res.status(400).json({ message: "payment intent not found" });
        }

        // here we are checling the userId and the hotelId that created 
        // the paymentIntent match or not
        if (
            paymentIntent.metadata.hotelId !== req.params.hotelId ||
            paymentIntent.metadata.userId !== req.userId
        ) {
            return res.status(400).json({ message: "payment intent mismatch" });
        }

        // check for payment is a success or not 
        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({
            message: `payment intent not succeeded. Status: ${paymentIntent.status}`,
            });
        }

        const newBooking: BookingType = {
            ...req.body,
            userId: req.userId,
        };

        const hotel = await Hotel.findOneAndUpdate(
            { _id: req.params.hotelId },
            {
                $push: { bookings: newBooking },
            }
        );

        if (!hotel) {
            return res.status(400).json({ message: "hotel not found" });
        }

        await hotel.save();
        res.status(200).send();
    } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
    }
});

const constructSearchQuery = (queryParams: any) => {
    let constructedQuery: any = {};

    if (queryParams.destination) {
        constructedQuery.$or = [
            { city: new RegExp(queryParams.destination, "i") },
            { country: new RegExp(queryParams.destination, "i") },
        ];
    }

    // this gets all the hotels that are greater than or equal (gte) the 
    // specified number of adults given by the user 
    if (queryParams.adultCount) {
        constructedQuery.adultCount = {
            $gte: parseInt(queryParams.adultCount),
        };
    }

    if (queryParams.childCount) {
        constructedQuery.childCount = {
            $gte: parseInt(queryParams.childCount),
        };
    }

    if (queryParams.facilities) {
        constructedQuery.facilities = {
            $all: Array.isArray(queryParams.facilities)
            ? queryParams.facilities
            : [queryParams.facilities],
        };
    }

    if (queryParams.types) {
        constructedQuery.type = {
            $in: Array.isArray(queryParams.types)
            ? queryParams.types
            : [queryParams.types],
        };
    }

    // we turn them into an array of numbers as query returns a string
    // since we can have multiple stars we find all hotels that has those
    // stars in them which is why we use $in 

    // $in is better used for top level object search in an array 
    // searching for all the hotels that has a name of A, but it wouldnt work
    // for searching for a userId in bookings as it is nested
    // {
    //     "name": "Hotel A",
    //     "bookings": [
    //       { "userId": "123", "date": "2023-01-01" },
    //       { "userId": "456", "date": "2023-01-02" }
    //     ]
    // }
    if (queryParams.stars) {
        const starRatings = Array.isArray(queryParams.stars)
            ? queryParams.stars.map((star: string) => parseInt(star))
            : parseInt(queryParams.stars);

        constructedQuery.starRating = { $in: starRatings };
    }

    // this gets all the hotels that are less than or equal (lte) the 
    // specified price written by the user  
    if (queryParams.maxPrice) {
        constructedQuery.pricePerNight = {
            $lte: parseInt(queryParams.maxPrice).toString(),
        };
    }

    return constructedQuery;
};

export default router