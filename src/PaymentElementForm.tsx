import { useCallback, useEffect, useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

interface PaymentElementFormProps {
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

const PaymentElementForm = ({ data = {} }: PaymentElementFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const intentType = data.intentType || "payment";

  const fetchClientSecret = useCallback(
    (
      data: PaymentElementFormProps["data"],
      intent: string
    ): Promise<string> => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setIsLoading(true);
    setError(null);

    const confirmMethod =
      intentType === "setup" ? stripe.confirmSetup : stripe.confirmPayment;
    const { error } = await confirmMethod({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/return`,
      },
    });

    if (error) {
      setError(error.message || "An error occurred during payment/setup.");
    }

    setIsLoading(false);
  };

  return (
    <div className="w-[100vw] min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Payment Elements Checkout
      </h2>
      <p className="text-gray-600 mb-6">Current Mode: {intentType}</p>
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        {clientSecret ? (
          <form onSubmit={handleSubmit}>
            <PaymentElement />
            {error && <p className="text-red-600 mt-2">{error}</p>}
            <button
              type="submit"
              disabled={!stripe || isLoading}
              className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
            >
              {isLoading
                ? "Processing..."
                : intentType === "setup"
                ? "Save Payment Method"
                : "Pay Now"}
            </button>
          </form>
        ) : (
          <p className="text-gray-600">Loading payment form...</p>
        )}
      </div>
    </div>
  );
};

const PaymentElementFormWrapper = (props: PaymentElementFormProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!props.data?.sessionKey) {
      const fetchClientSecret = async () => {
        const response = await fetch(`${BASE_URL}/create-checkout-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              pmode: "payment",
              pprice: props.data?.pprice || "price_1PQQK5J7dziG102esKWfWGre",
              intentType: props.data?.intentType || "payment",
            },
          }),
        });
        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      };
      fetchClientSecret();
    } else {
      setClientSecret(props.data.sessionKey);
    }
  }, [props.data]);

  return clientSecret ? (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentElementForm {...props} />
    </Elements>
  ) : (
    <div className="w-[100vw] min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <p className="text-gray-600">Loading payment form...</p>
    </div>
  );
};

export default PaymentElementFormWrapper;
