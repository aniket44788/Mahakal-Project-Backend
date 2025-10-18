import razorpay from "../config/razorpay.js"; 

const createOrder = async (req, res) => {
  const { amount, currency } = req.body;

  const options = {
    amount: amount * 100, // Convert to paise
    currency: currency || "INR",
    receipt: "receipt_" + Date.now(),
    payment_capture: 1,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error creating order" });
  }
};

export default createOrder;
