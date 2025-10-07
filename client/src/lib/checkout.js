import { authedFetch } from "./utils";
import { loadRazorpay } from "./razorpay";

export async function startCheckout({ productType, jobId }) {
  await loadRazorpay();

  const order = await authedFetch("/api/payments/order", {
    method: "POST",
    body: JSON.stringify({ productType, jobId }),
  });

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "HelperBee",
      description: order.label,
      order_id: order.orderId,
      prefill: { name: order.customer?.name, email: order.customer?.email },
      theme: { color: "#111827" },
      handler: async (resp) => {
        try {
          const result = await authedFetch("/api/payments/verify", {
            method: "POST",
            body: JSON.stringify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          resolve(result);
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => resolve(null) },
    });

    rzp.open();
  });
}