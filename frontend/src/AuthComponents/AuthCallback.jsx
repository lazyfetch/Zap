import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { JoinRoom, emitUserOnline } from '../ClientSocket/ClientSocket';
import {API_URL} from "../config.js"
const AuthCallback = ({ onLoginSuccess }) => {
  const location = useLocation();

  useEffect(() => {
    const handleGoogleAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const accessToken = urlParams.get('accessToken');
      const refreshToken = urlParams.get('refreshToken');
      const userStr = urlParams.get('user');
      const error = urlParams.get('error');

      if (error) 
      {
        console.error('Google auth error:', error);
        window.location.href = '/login?error=' + error;
        return
      }

      if (accessToken && refreshToken && userStr) 
      {
        try 
        {
          const user = JSON.parse(decodeURIComponent(userStr));
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          await fetch(`${API_URL}/api/v1/users/presence`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ online: true })
          });

          JoinRoom(user._id);
          emitUserOnline(user._id);
          
          onLoginSuccess(user);
        } 
        catch (error) 
        {
          console.error('Error processing Google auth:', error);
          window.location.href = '/login?error=processing_failed';
        }
      } 
      else 
      {
        window.location.href = '/login?error=missing_data'
      }
    }

    handleGoogleAuthCallback()
  }, [location, onLoginSuccess])

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing login...</p>
      </div>
    </div>
  );
};

export default AuthCallback;