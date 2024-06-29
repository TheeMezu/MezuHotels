import express, { Request, Response } from "express";
import Hotel from "../models/hotel";
import { HotelSearchResponse } from "../shared/types";
import { param, validationResult } from "express-validator";

const router = express.Router();

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