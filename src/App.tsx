import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import CheckoutForm from "./CheckoutForm";
import PaymentElementForm from "./PaymentElementForm";
import { useEffect, useState } from "react";

const CheckoutModal = ({
  isOpen,
  onClose,
  intentType,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  intentType: "payment" | "setup";
  onSubmit: (productId: string, priceId: string) => void;
}) => {
  const [productId, setProductId] = useState("");
  const [priceId, setPriceId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(productId, priceId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Enter Checkout Details ({intentType})
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Product ID:</label>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="prod_xxx"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Price ID:</label>
            <input
              type="text"
              value={priceId}
              onChange={(e) => setPriceId(e.target.value)}
              placeholder="price_xxx"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              required={intentType === "payment"}
              disabled={intentType === "setup"}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              Generate Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [paymentIntentSecret, setPaymentIntentSecret] = useState<string>("");
  const [setupIntentSecret, setSetupIntentSecret] = useState<string>("");
  const [checkoutSessionSecret, setCheckoutSessionSecret] =
    useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIntentType, setModalIntentType] = useState<"payment" | "setup">(
    "payment"
  );
  const [formType, setFormType] = useState<"checkout" | "paymentElement">(
    "checkout"
  );
  const BASE_URL =
    import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:4242";

  const handleOpenModal = (type: "payment" | "setup") => {
    setModalIntentType(type);
    setIsModalOpen(true);
  };

  const handleGenerateSession = async (productId: string, priceId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            pmode: "payment",
            pprice: priceId || "price_1PQQK5J7dziG102esKWfWGre",
            intentType: modalIntentType,
            productId,
            formType, // Pass formType to backend
          },
        }),
      });
      const { clientSecret } = await response.json();
      navigate("/checkout", {
        state: {
          sessionKey: clientSecret,
          intentType: modalIntentType,
          formType,
        },
      });
    } catch (error) {
      console.error("Error generating session:", error);
    }
  };

  const handleCheckoutWithSecret = () => {
    if (checkoutSessionSecret && formType === "checkout") {
      navigate("/checkout", {
        state: {
          sessionKey: checkoutSessionSecret,
          intentType: "payment",
          formType,
        },
      });
    } else if (paymentIntentSecret && formType === "paymentElement") {
      navigate("/checkout", {
        state: {
          sessionKey: paymentIntentSecret,
          intentType: "payment",
          formType,
        },
      });
    } else if (setupIntentSecret && formType === "paymentElement") {
      navigate("/checkout", {
        state: { sessionKey: setupIntentSecret, intentType: "setup", formType },
      });
    }
  };

  const isTokenProvided =
    (checkoutSessionSecret && formType === "checkout") ||
    (paymentIntentSecret && formType === "paymentElement") ||
    (setupIntentSecret && formType === "paymentElement");

  return (
    <div className="w-[100vw] min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Stripe Checkout Demo
      </h1>
      <div className="mb-6">
        <label className="mr-4">
          <input
            type="radio"
            value="checkout"
            checked={formType === "checkout"}
            onChange={() => setFormType("checkout")}
            className="mr-2"
          />
          Embedded Checkout
        </label>
        <label>
          <input
            type="radio"
            value="paymentElement"
            checked={formType === "paymentElement"}
            onChange={() => setFormType("paymentElement")}
            className="mr-2"
          />
          Payment Elements
        </label>
      </div>
      <nav className="space-x-4 mb-8">
        <button
          onClick={() => handleOpenModal("payment")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isTokenProvided}
        >
          Test Payment Mode
        </button>
        <button
          onClick={() => handleOpenModal("setup")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isTokenProvided}
        >
          Test Setup Mode
        </button>
      </nav>
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        {isTokenProvided && (
          <p className="text-sm text-gray-500 mb-4">
            Buttons disabled while using a direct token. Clear the token to
            enable.
          </p>
        )}
        {formType === "checkout" ? (
          <label className="block mb-4">
            <span className="text-gray-700">Checkout Session Secret:</span>
            <input
              type="text"
              value={checkoutSessionSecret}
              onChange={(e) => setCheckoutSessionSecret(e.target.value)}
              placeholder="cs_xxx_secret_xxx"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-200"
            />
          </label>
        ) : (
          <>
            <label className="block mb-4">
              <span className="text-gray-700">Payment Intent Secret:</span>
              <input
                type="text"
                value={paymentIntentSecret}
                onChange={(e) => setPaymentIntentSecret(e.target.value)}
                disabled={!!setupIntentSecret}
                placeholder="pi_xxx_secret_xxx"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-200"
              />
            </label>
            <label className="block mb-4">
              <span className="text-gray-700">Setup Intent Secret:</span>
              <input
                type="text"
                value={setupIntentSecret}
                onChange={(e) => setSetupIntentSecret(e.target.value)}
                disabled={!!paymentIntentSecret}
                placeholder="seti_xxx_secret_xxx"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-200"
              />
            </label>
          </>
        )}
        <button
          onClick={handleCheckoutWithSecret}
          disabled={
            !checkoutSessionSecret && !paymentIntentSecret && !setupIntentSecret
          }
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
        >
          Use Intent Secret
        </button>
      </div>
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        intentType={modalIntentType}
        onSubmit={handleGenerateSession}
      />
    </div>
  );
};

const CheckoutPage = () => {
  const { state } = useLocation();
  const formType = state?.formType || "checkout";

  return formType === "checkout" ? (
    <CheckoutForm data={state || {}} />
  ) : (
    <PaymentElementForm data={state || {}} />
  );
};

const ReturnPage = () => {
  const { search } = useLocation();
  const [status, setStatus] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(search);
    const sessionId = query.get("session_id");
    const paymentIntent = query.get("payment_intent");
    const setupIntent = query.get("setup_intent");
    console.log("URL Params:", { sessionId, paymentIntent, setupIntent });

    const fetchStatus = async () => {
      try {
        let response;
        if (sessionId) {
          response = await fetch(
            `${
              import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:4242"
            }/session-status?session_id=${sessionId}`
          );
        } else if (paymentIntent) {
          response = await fetch(
            `${
              import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:4242"
            }/intent-status?intent_id=${paymentIntent}`
          );
        } else if (setupIntent) {
          response = await fetch(
            `${
              import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:4242"
            }/intent-status?intent_id=${setupIntent}`
          );
        } else {
          throw new Error("No valid session or intent ID found");
        }

        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log("Status response:", data);
        setStatus(data.status === "succeeded" ? "complete" : data.status);
        setCustomerEmail(data.customer_email || null);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        console.error("Error fetching status:", errorMessage);
        setError(errorMessage);
        setStatus("error");
      }
    };

    fetchStatus();
  }, [search]);

  return (
    <div className="w-[100vw] min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout Result</h1>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        {status === "complete" && (
          <>
            <p className="text-green-600 font-semibold">
              Success! Your {customerEmail ? "payment" : "payment method setup"}{" "}
              is complete.
            </p>
            {customerEmail && (
              <p className="text-gray-700 mt-2">Email: {customerEmail}</p>
            )}
          </>
        )}
        {status === "open" && (
          <p className="text-yellow-600">
            Checkout session is still open. Did you cancel?
          </p>
        )}
        {status === "error" && (
          <p className="text-red-600">
            {error || "An error occurred. Please try again."}
          </p>
        )}
        {!status && <p className="text-gray-600">Loading...</p>}
        <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to Home
        </a>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/return" element={<ReturnPage />} />
      </Routes>
    </Router>
  );
}

export default App;
