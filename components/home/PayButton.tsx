import axios from "axios";
import logo from "@/assets/landing/paxio2.png";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { useState } from "react";

export default function PayButton() {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        try {
            setLoading(true);
            const { data } = await axios.post("/api/payments/create-order");
            
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                toast("Failed to create checkout session");
                setLoading(false);
            }

            // const options = {
            //     key: data.key,
            //     order_id: data.orderId,
            //     amount: data.amount,
            //     currency: data.currency,
            //
            //     name: "Paxio",
            //     description: "30 days access",
            //     image: logo.src,
            //
            //     handler: async function (response: any) {
            //         try {
            //             const verifyRes = await axios.post(
            //                 "/api/payments/verify",
            //                 {
            //                     razorpay_order_id: response.razorpay_order_id,
            //                     razorpay_payment_id: response.razorpay_payment_id,
            //                     razorpay_signature: response.razorpay_signature,
            //                 },
            //                 {
            //                     headers: { "Content-Type": "application/json" },
            //                 }
            //             );
            //
            //             if (verifyRes.data.success) {
            //                 toast("Payment successful 🎉");
            //                 // Redirect to dashboard after successful payment
            //                 window.location.href = "/voice";
            //             } else {
            //                 toast("Payment verification failed");
            //             }
            //         } catch (err) {
            //             toast("Verification error");
            //         }
            //     },
            //
            //     theme: {
            //         color: "#18181B",
            //
            //     },
            // };

            // const rzp = new (window as any).Razorpay(options);
            // rzp.open();
        } catch (error) {
            toast("Unable to initiate payment");
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center">
            <Button
                onClick={handlePayment}
                className="
    cursor-pointer
    px-6 py-5
    bg-white text-black
    hover:bg-white hover:text-black
    active:bg-white
    focus-visible:bg-white
  "
            >
                Pay ₹10
            </Button>
        </div>
    );
}