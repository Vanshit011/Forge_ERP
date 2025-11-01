import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Login.css';

const API_URL = 'http://localhost:5000/api';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));

        // Show success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background */}
      <div className="login-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      {/* Login Card */}
      <div className="login-card">
        <div className="login-header">
          <div className="logo-wrapper">
            <div className="logo-icon">🏭</div>
          </div>
          <h1>Forge ERP</h1>
          <p className="tagline">Manufacturing Operations Management System</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="arrow">→</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="footer-text">
            Secure Login • Version 2.0.0
          </p>
        </div>
      </div>

      {/* Features Section */}
      {/* <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">📦</div>
          <h3>Inventory Management</h3>
          <p>Track raw materials and stock</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">✂️</div>
          <h3>Cutting Operations</h3>
          <p>Manage sharing & circular cutting</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔨</div>
          <h3>Forging Process</h3>
          <p>Complete production tracking</p>
        </div>
      </div> */}
    </div>
  );
}

export default Login;
