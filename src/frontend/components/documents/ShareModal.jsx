import React, { useState } from 'react';
import { documentsAPI } from '../../services/api';
import useApiCall from '../../hooks/useApiCall';
import { toast } from 'react-hot-toast';
import { ShareIcon, XMarkIcon } from '@heroicons/react/24/outline';

function ShareModal({ document, onClose }) {
  const [email, setEmail] = useState('');
  const { loading, execute } = useApiCall();

  const handleShare = async (e) => {
    e.preventDefault();
        await execute(
      () => documentsAPI.shareDocument(document.documentId || document.id, email),
      {
        onSuccess: () => {
          setEmail('');
          onClose();
        },
        successMessage: `Document shared with ${email}`,
        errorMessage: 'Failed to share document'
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <ShareIcon className="h-5 w-5 mr-2 text-blue-600" />
            Share "{document.title}"
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleShare}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share with email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              The user will be able to view and edit this document
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShareModal;