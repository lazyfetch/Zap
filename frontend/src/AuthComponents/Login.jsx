import { useState } from 'react';
import { JoinRoom, emitUserOnline } from '../ClientSocket/ClientSocket';

const Login = ({ onLoginSuccess, onShowRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try 
    {
      const response=await fetch('http://localhost:3000/api/v1/auth/login',{
        method:'POST',
        headers:
        {
            'Content-Type':'application/json'
        },
        credentials: 'include',
        body:JSON.stringify({
            username:formData.username,
            password:formData.password
        })
      })
      const data=await response.json()
      if(!data.success)
      {
        setError(data.message || "Login failed");
      }
      else
      {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        
        await fetch('http://localhost:3000/api/v1/users/presence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.data.accessToken}`
            },
            body: JSON.stringify({ online: true })
        });

        JoinRoom(data.data.user._id)
        emitUserOnline(data.data.user._id)
        onLoginSuccess(data.data.user)
      }
      
    } 
    catch (err) 
    {
      setError(err.message || 'Login failed. Please try again.');
    } 
    finally 
    {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to continue to Zap</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={`w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="text-center mt-6 text-gray-600">
          <p>
            Don't have an account?
            <button
              type="button"
              onClick={onShowRegister}
              className="ml-1 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;