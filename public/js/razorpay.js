import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    // 1. Create order from backend
    const { data } = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`,
    });

    // 2. Configure Razorpay Checkout
    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: data.order.currency,
      name: 'Natours',
      description: data.tour.description,
      order_id: data.order.id,

      // 3. Handle successful payment
      handler: async function (response) {
        try {
          await axios({
            method: 'POST',
            url: '/api/v1/bookings/verify-payment',
            data: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });

          showAlert('success', 'Payment successful! Your tour is booked.');
          window.setTimeout(() => location.assign('/my-tours'), 1500);
        } catch (err) {
          showAlert(
            'error',
            err.response?.data?.message || 'Payment verification failed.'
          );
        }
      },

      prefill: {
        name: '',
        email: '',
      },

      theme: {
        color: '#55c57a',
      },
    };

    // 4. Open Razorpay Checkout
    const razorpay = new window.Razorpay(options);

    razorpay.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      alert(response.error.description);
    });

    razorpay.open();
  } catch (err) {
    console.error('Checkout error:', err.response?.data || err);
    alert('Unable to initiate payment. Please try again.');
  }
};
