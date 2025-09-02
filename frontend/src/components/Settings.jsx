import { useState, useRef } from 'react';
import { FiUser, FiLock, FiCamera, FiTrash2, FiUpload, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Settings({ currentUser, onUserUpdate, onLogout }) 
{
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef(null);

  const [username, setUsername] = useState(currentUser.username);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleUsernameChange = async () => {
    if (!username.trim() || username === currentUser.username) return;
    
    setLoading(true);
    try 
    {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/api/v1/users/change-username', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({ newUsername: username })
      });

      const data = await response.json()
      if (data.success) 
      {
        onUserUpdate({ ...currentUser, username: data.data.username })
        alert('Username updated successfully!')
      } 
      else 
      {
        alert(data.message || 'Failed to update username')
      }
    } 
    catch (error) 
    {
      alert('Error updating username: ', error)
    } 
    finally 
    {
      setLoading(false)
    }
  };

  const handlePasswordChange = async () => {
    if (!password || password !== confirmPassword) 
    {
      alert('Passwords do not match')
      return
    }
    if (password.length < 6) 
    {
      alert('Password must be at least 6 characters')
      return
    }

    setLoading(true);
    try 
    {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/api/v1/users/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({ newPassword: password })
      })

      const data = await response.json();
      if (data.success) 
      {
        alert('Password updated! Please login again.')
        onLogout()
      } 
      else 
      {
        alert(data.message || 'Failed to update password')
      }
    } 
    catch (error) 
    {
      alert('Error updating password: ', error);
    } 
    finally 
    {
      setLoading(false)
      setPassword('')
      setConfirmPassword('')
    }
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file)
    {
      return
    }

    if (!file.type.startsWith('image/')) 
    {
      alert('Please select an image file');
      return;
    }

    setLoading(true);
    try 
    {
      const formData = new FormData();
      formData.append('avatar', file);

      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/api/v1/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        onUserUpdate({ ...currentUser, avatar: data.data.avatar });
        alert('Avatar updated successfully!');
      } else {
        alert(data.message || 'Failed to update avatar');
      }
    } 
    catch (error) 
    {
      alert('Error updating avatar: ',error);
    } 
    finally 
    {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);
    try 
    {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/api/v1/users/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) 
      {
        alert('Account deleted successfully')
        onLogout()
      } 
      else 
      {
        alert(data.message || 'Failed to delete account')
      }
    } 
    catch (error) 
    {
      alert('Error deleting account: ',error);
    } 
    finally 
    {
      setLoading(false)
      setShowDeleteModal(false)
      setDeleteConfirmation('')
    }
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-amber-400 mb-6">Settings</h2>
        <div className="flex space-x-1 mb-6 bg-gray-900 rounded-lg p-1">
          {[
            { id: 'profile', label: 'Profile', icon: FiUser },
            { id: 'security', label: 'Security', icon: FiLock },
            { id: 'danger', label: 'Delete', icon: FiTrash2 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-colors ${
                activeSection === id
                  ? 'bg-amber-500 text-black'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Icon className="mr-2" size={16} />
              {label}
            </button>
          ))}
        </div>

        {activeSection === 'profile' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
                <FiCamera className="mr-2" />
                Profile Picture
              </h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium text-xl border-2 border-gray-600">
                      {currentUser.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-600 text-black p-2 rounded-full transition-colors"
                    disabled={loading}
                  >
                    <FiUpload size={12} />
                  </button>
                </div>
                <div>
                  <p className="text-gray-300 mb-1">Upload a new avatar</p>
                  <p className="text-xs text-gray-500">JPG, PNG or GIF (max 5MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
                <FiUser className="mr-2" />
                Username
              </h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter new username"
                />
                <button
                  onClick={handleUsernameChange}
                  disabled={loading || !username.trim() || username === currentUser.username}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
              <FiLock className="mr-2" />
              Change Password
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="New password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-sm">Passwords do not match</p>
              )}
              <button
                onClick={handlePasswordChange}
                disabled={loading || !password || password !== confirmPassword}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
              <p className="text-xs text-gray-500">
                Note: You will be logged out after changing your password for security reasons.
              </p>
            </div>
          </div>
        )}
        {activeSection === 'danger' && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
              <FiTrash2 className="mr-2" />
            </h3>
            <div className="space-y-4">
              <p className="text-gray-300">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-red-400 mb-4">Delete Account</h3>
              <p className="text-gray-300 mb-4">
                This action cannot be undone. This will permanently delete your account and all your data.
              </p>
              <p className="text-gray-300 mb-4">
                Please type <span className="text-red-400 font-mono">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type DELETE to confirm"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirmation !== 'DELETE'}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}