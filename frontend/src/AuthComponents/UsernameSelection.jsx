import { useState, useEffect } from 'react';
import { JoinRoom, emitUserOnline } from '../ClientSocket/ClientSocket';

const UsernameSelection = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tempUserId = urlParams.get('tempUserId');
    const email = urlParams.get('email');
    const avatar = urlParams.get('avatar');
    const displayName = urlParams.get('displayName');

    console.log('URL params:', { tempUserId, email, avatar, displayName });

    if (tempUserId && email) 
    {
      setUserInfo({
        tempUserId,
        email: decodeURIComponent(email),
        avatar: avatar ? decodeURIComponent(avatar) : '',
        displayName: displayName ? decodeURIComponent(displayName) : ''
      });

      if (displayName) 
      {
        const defaultUsername = decodeURIComponent(displayName).toLowerCase().replace(/\s+/g, '').replace(/\d+$/, '');
        setUsername(defaultUsername);
      }
    } 
    else 
    {
      console.error('Missing required parameters');
      setError('Missing required information. Please try again.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (username.length < 3) 
    {
      setError('Username must be at least 3 characters long')
      return
    }

    setIsLoading(true);
    setError('');

    try 
    { 
      const response = await fetch('http://localhost:3000/api/v1/auth/google/complete-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tempUserId: userInfo.tempUserId,
          username: username
        })
      });

      const data = await response.json();
      console.log('Complete signup response:', data);
      
      if (!data.success)
      {
        setError(data.message || 'Failed to complete signup')
        return
      }

      localStorage.setItem('accessToken', data.data.accessToken)
      localStorage.setItem('refreshToken', data.data.refreshToken)
      
      await fetch('http://localhost:3000/api/v1/users/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.data.accessToken}`
        },
        body: JSON.stringify({ online: true })
      });

      JoinRoom(data.data.user._id);
      emitUserOnline(data.data.user._id);
      
      onLoginSuccess(data.data.user);
      
    } 
    catch (error) 
    {
      setError('An error occurred. Please try again.')
      console.error('Complete signup error:', error)
    } 
    finally 
    {
      setIsLoading(false)
    }
  }

  if (!userInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mb-4">
            {userInfo.avatar ? (
              <img
                src={userInfo.avatar}
                alt="Profile"
                className="w-20 h-20 rounded-full mx-auto object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mx-auto text-gray-600 text-2xl font-semibold">
                {userInfo.email.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Username</h2>
          <p className="text-gray-600">Welcome, {userInfo.email}</p>
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
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="Choose a unique username"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              minLength={3}
              pattern="[a-z0-9_]+"
              title="Username can only contain lowercase letters, numbers, and underscores"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only lowercase letters, numbers, and underscores allowed
            </p>
          </div>
          
          <button 
            type="submit" 
            className={`w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Complete Signup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernameSelection;