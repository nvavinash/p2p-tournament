const axios = require('axios');

const API_URL = 'http://localhost:5001/api/auth';

const testAuth = async () => {
  try {
    console.log('Testing Registration...');
    const registerRes = await axios.post(`${API_URL}/register`, {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      playerId: `player${Date.now()}`
    });
    console.log('Registration Successful:', registerRes.data);
    const token = registerRes.data.token;

    console.log('\nTesting Login...');
    const loginRes = await axios.post(`${API_URL}/login`, {
      email: registerRes.data.email,
      password: 'password123'
    });
    console.log('Login Successful:', loginRes.data);

    console.log('\nTesting Protected Route (/me)...');
    try {
        const meRes = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Protected Route Access Successful:', meRes.data);
    } catch (err) {
        console.error('Protected Route Access Failed:', err.response ? err.response.data : err.message);
    }

  } catch (error) {
    console.error('Test Failed:', error);
    if (error.response) {
      console.error('Response Data:', error.response.data);
      console.error('Response Status:', error.response.status);
    }
  }
};

testAuth();
