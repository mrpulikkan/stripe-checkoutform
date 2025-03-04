import { useCallback, useEffect, useState } from "react";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

interface CheckoutFormProps {
  data?: {
    intentType?: string;
    pprice?: string;
    sessionKey?: string;
  };
}

const stripePromise = loadStripe(
  import.meta.env.VITE_APP_STRIPE_PUBLIC_KEY || ""
);
const BASE_URL =
  import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:4242";

const CheckoutForm = ({ data = {} }: CheckoutFormProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const intentType = data.intentType || "payment";

  const fetchClientSecret = useCallback(
    (data: CheckoutFormProps["data"], intent: string): Promise<string> => {
      const requestBody = {
        data: {
          pmode: "payment",
          pprice: data?.pprice || "price_1PQQK5J7dziG102esKWfWGre",
          intentType: intent,
        },
      };
      console.log("Sending request:", requestBody);

      return fetch(`${BASE_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
        .then((res) => res.json())
        .then((data: { clientSecret: string }) => {
          console.log("Received clientSecret:", data.clientSecret);
          return data.clientSecret;
        })
        .catch((error: unknown) => {
          console.error("Error fetching client secret:", error);
          throw error;
        });
    },
    []
  );

  useEffect(() => {
    if (!data.sessionKey) {
      fetchClientSecret(data, intentType).then(setClientSecret);
    } else {
      setClientSecret(data.sessionKey);
    }
  }, [data, intentType, fetchClientSecret]);

  const options = {
    clientSecret: clientSecret || data.sessionKey || undefined,
  };

  return (
    <div className="w-[100vw] min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Checkout</h2>
      <p className="text-gray-600 mb-6">Current Mode: {intentType}</p>
      <div className="w-full max-w-md">
        {clientSecret || data.sessionKey ? (
          <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        ) : (
          <p className="text-gray-600">Loading checkout...</p>
        )}
      </div>
    </div>
  );
};

export default CheckoutForm;
