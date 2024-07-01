
import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import BookingForm from "../forms/BookingForm/BookingForm";
import { useSearchContext } from "../contexts/SearchContext";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import BookingDetailsSummary from "../components/BookingDetailsSummary";
import { Elements } from "@stripe/react-stripe-js";
import { useAppContext } from "../contexts/AppContext";

const Booking = () => {
    // stripe initializing that we did in AppContext so it loads along with the 
    // app once
    const { stripePromise } = useAppContext();
    const search = useSearchContext();
    const { hotelId } = useParams();

    // we must use a state here as this is dependent on the checkin and checkout
    // dates from searchContext hook 
    const [numberOfNights, setNumberOfNights] = useState<number>(0);

    // thats why we use a useEffect so we get the new number of nights
    useEffect(() => {
        if (search.checkIn && search.checkOut) {
        const nights =
            Math.abs(search.checkOut.getTime() - search.checkIn.getTime()) /
            (1000 * 60 * 60 * 24);

        setNumberOfNights(Math.ceil(nights)); // ceil for getting a whole number
        }
    }, [search.checkIn, search.checkOut]);

    const { data: paymentIntentData } = useQuery(
        "createPaymentIntent",
        () =>
        apiClient.createPaymentIntent(
            hotelId as string,
            numberOfNights.toString()
        ),
        {
        enabled: !!hotelId && numberOfNights > 0, // good security measure
        }
    );

    const { data: hotel } = useQuery(
        "fetchHotelByID",
        () => apiClient.fetchHotelById(hotelId as string),
        {
        enabled: !!hotelId,
        }
    );

    const { data: currentUser } = useQuery(
        "fetchCurrentUser",
        apiClient.fetchCurrentUser
    );

    if (!hotel) {
        return <></>;
    }

    return (
        <div className="grid md:grid-cols-[1fr_2fr]">
        <BookingDetailsSummary
            checkIn={search.checkIn}
            checkOut={search.checkOut}
            adultCount={search.adultCount}
            childCount={search.childCount}
            numberOfNights={numberOfNights}
            hotel={hotel}
        />
        {currentUser && paymentIntentData && (
            // elements comes from stripe sdk gives us access to some stripe ui 
            // elements to let the user pay from the ui
            <Elements
            stripe={stripePromise}
            options={{clientSecret: paymentIntentData.clientSecret,}}
            >
                <BookingForm
                    currentUser={currentUser}
                    paymentIntent={paymentIntentData}
                />
            </Elements>
        )}
        </div>
    );
};

export default Booking;
