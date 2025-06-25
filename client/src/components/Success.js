// src/Success.js
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const Success = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const orderId = query.get('order_id');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('http://localhost:4000/profile', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUserEmail(response.data.email);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Payment Successful!</h1>
      <p className="mt-4">Order ID: {orderId}</p>
      {userEmail && <p className="mt-2">Paid by: {userEmail}</p>}
      <a
        href="/customer"
        className="mt-6 bg-teal-800 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
      >
        Back to Home
      </a>
    </div>
  );
};

export default Success;