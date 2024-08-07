import React, { useContext, useState } from "react";
import Toast from "../components/Toast";
import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import { loadStripe, Stripe } from "@stripe/stripe-js";

const STRIPE_PUB_KEY = import.meta.env.VITE_STRIPE_PUB_KEY || "";

type ToastMessage = {
    message: string;
    type: "SUCCESS" | "ERROR";
};

type AppContext = {
    showToast: (toastMessage: ToastMessage) => void;
    isLoggedIn: boolean;
    stripePromise: Promise<Stripe | null>;
};

const AppContext = React.createContext<AppContext | undefined>(undefined);

// this good so it runs only once in the appContext
const stripePromise = loadStripe(STRIPE_PUB_KEY);

export const AppContextProvider = ({children,}: {
    children: React.ReactNode;
    }) => {
    const [toast, setToast] = useState<ToastMessage | undefined>(undefined);

    // this alone wont run again as no refresh happened for it to rerender
    // so we wil use invalidateQueries to make it invali which will cause
    // isError to change which will then force us to log out
    const { isError } = useQuery("validateToken", apiClient.validateToken, {
        retry: false,
    });

    return (
        <AppContext.Provider
        value={{
            showToast: (toastMessage) => {
            setToast(toastMessage);
            },
            isLoggedIn: !isError,
            stripePromise,
        }}
        >
        {toast && (
            <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(undefined)}
            />
        )}
        {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    return context as AppContext;
};