import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';
import useApiCall from '../../hooks/useApiCall';
import { EnvelopeIcon, PencilIcon, CheckIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

function Profile({ user, onClose, onUpdateUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  
  const { loading: saving, execute } = useApiCall();

  const handleSave = async () => {
    await execute(
      () => authAPI.updateProfile(name),
      {
        onSuccess: () => {
          // update locally too
          const updatedUser = {
            ...user,
            name: name
          };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          onUpdateUser(updatedUser);
          setIsEditing(false);
        },
        successMessage: 'Profile updated successfully!',
        errorMessage: 'Failed to update profile'
      }
    );
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 
                   dark:text-gray-400 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Documents
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Your Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account information
        </p>
      </div>

      {/* Profile Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-primary-600 flex items-center 
                        justify-center text-white text-2xl font-medium">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {user?.name || 'User'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Name
          </label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field flex-1"
                placeholder="Enter your name"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 
                         rounded-lg transition-colors"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 
                         rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 
                          dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-900 dark:text-gray-100">
                {user?.name || 'Not set'}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                         dark:hover:text-gray-200 transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 
                        rounded-lg text-gray-900 dark:text-gray-100">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            <span>{user?.email}</span>
          </div>
        </div>

        {/* User ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            User ID
          </label>
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {user?.userId}
            </span>
          </div>
        </div>

        {/* Account Created */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Member Since
          </label>
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
