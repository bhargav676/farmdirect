// src/Payment.js
import React, { useEffect } from 'react';
import axios from 'axios';


const loadCashfreeSDK = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => {
      console.log('Cashfree SDK loaded successfully.');
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Cashfree SDK.');
      resolve(false);
    };
    document.body.appendChild(script); 
  });
};

const Payment = ({ totalCost }) => {
  // Load the SDK as soon as the component is mounted
  useEffect(() => {
    loadCashfreeSDK();
  }, []);

  // Function to call backend to create a payment order
  const createOrder = async () => {
    try {
      console.log('Attempting to create order...');
      const token = localStorage.getItem('token'); // Retrieve JWT token from local storage
      if (!token) {
        alert('You must be logged in to make a payment.');
        return null;
      }

      const response = await axios.post(
        'https://farmdirectserver.vercel.app/api/create-order',
        {
          order_amount: totalCost, // Pass the totalCost from props
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`, // Include JWT token in headers
          },
        }
      );
      console.log('Received response from backend:', response.data);

      const { payment_session_id } = response.data;

      if (payment_session_id) {
        console.log('Successfully extracted payment_session_id.');
        return payment_session_id;
      } else {
        throw new Error('Could not get payment session ID from server response.');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Check the browser console for details.');
      return null;
    }
  };

  // Function to handle the payment flow
  const handlePayment = async () => {
    console.log('--- Starting Payment Process ---');

    const sessionId = await createOrder();
    if (!sessionId) {
      console.log('Stopping payment process because session ID is missing.');
      return;
    }

    if (!window.Cashfree) {
      console.error('Cashfree SDK is not available.');
      alert('Cashfree SDK is not loaded! Please refresh the page.');
      return;
    }

    const cashfree = new window.Cashfree();
    console.log('Cashfree SDK initialized.');

    console.log('Launching payment modal...');
    cashfree.checkout({
      paymentStyle: 'modal',
      paymentSessionId: sessionId,
      mode: 'sandbox',
    }).then((result) => {
      if (result.error) {
        console.error('Payment Error:', result.error);
        alert(`Payment Error: ${result.error.message}`);
      }
      if (result.payment) {
        console.log('Payment successful:', result.payment);
        alert(`Payment successful! Transaction ID: ${result.payment.cf_payment_id}`);
      }
      if (result.redirect) {
        console.log('User was redirected for authentication.');
      }
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Pay ₹{totalCost}</h2>
      <button
        onClick={handlePayment}
        className="bg-teal-800 w-full h-12 rounded-lg text-white text-base font-semibold hover:bg-teal-700 transition-transform transform hover:scale-105 shadow-md"
      >
        Proceed to Pay ₹{totalCost}
      </button>
    </div>
  );
};

export default Payment;