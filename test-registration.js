// Test the exact same registration request that the frontend would make

const API_BASE_URL = 'http://localhost:5000/api';

const testRegistration = async () => {
  console.log('Testing registration with frontend-like request...');
  
  const userData = {
    name: 'Frontend Test',
    email: 'frontend.test@example.com',
    phone: '9876543210',
    password: 'password123'
  };

  try {
    console.log('Making fetch request to:', `${API_BASE_URL}/auth/register`);
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error?.message || data.message || 'Request failed'}`);
    }

    if (!data.success) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    console.log('✅ Registration successful!');
    return data.data;

  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    
    // Check if it's a network error specifically
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
      console.error('This is a network connectivity issue!');
    }
    
    throw error;
  }
};

// Test if we're in Node.js or browser environment
if (typeof fetch === 'undefined') {
  console.log('Running in Node.js - installing fetch...');
  // This would be for Node.js testing, but we'll run it in browser
  console.log('Please run this in a browser console or copy to the test HTML file.');
} else {
  testRegistration();
}