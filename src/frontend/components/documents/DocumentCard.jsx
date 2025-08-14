import React, { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ConfirmDialog } from '../common';
import { 
  DocumentTextIcon, 
  ClockIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

function DocumentCard({ document, onSelect, onDelete, onShare, onDuplicate }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async (e) => {
    // Only stop propagation if event exists
    if (e) e.stopPropagation();
    setIsDeleting(true);
    
    try {
      await onDelete(document.documentId);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      if (diffHours < 1) {
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));
        if (diffMinutes < 1) {
          return 'Just now';
        }
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getWordCount = () => {
    if (!document.content) return 0;
    // Strip HTML tags for word count
    const text = document.content.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  const getPreviewText = () => {
    if (!document.content) return 'Empty document';
    // Strip HTML tags and get preview
    const text = document.content.replace(/<[^>]*>/g, ' ').trim();
    return text.substring(0, 150) + (text.length > 150 ? '...' : '');
  };

  const wordCount = getWordCount();

  return (
    <>
      <div
        onClick={onSelect}
        className="card-hover group relative cursor-pointer 
                   transition-all duration-200"
      >
        {/* Gradient border on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 
                      opacity-0 group-hover:opacity-10 transition-opacity duration-300 
                      pointer-events-none rounded-lg" />
        
        <div className="card-body relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0 p-2 bg-primary-100 dark:bg-primary-900/20 
                            rounded-lg group-hover:scale-110 transition-transform duration-200">
                <DocumentTextIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 
                             truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 
                             transition-colors">
                  {document.title}
                </h3>
                {/* Shared indicator */}
                {document.isShared && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                    <ShareIcon className="h-3 w-3" />
                    Shared with you
                  </span>
                )}
                {document.sharedWith && document.sharedWith.length > 0 && document.isOwned && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400">
                    <ShareIcon className="h-3 w-3" />
                    Shared with {document.sharedWith.length} user{document.sharedWith.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Menu - Positioned to overflow */}
            <Menu as="div" className="relative flex-shrink-0 z-10">
              <Menu.Button 
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md 
                         transition-colors opacity-0 group-hover:opacity-100"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 z-[100] mt-2 w-48 rounded-lg bg-white 
                           dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 
                           focus:outline-none divide-y divide-gray-100 dark:divide-gray-700
                           origin-top-right"
                >
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate && onDuplicate(document);  // Handle duplicate
                          }}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } flex items-center px-4 py-2 text-sm text-gray-700 
                            dark:text-gray-200 w-full transition-colors`}
                        >
                          <DocumentDuplicateIcon className="mr-3 h-4 w-4" />
                          Duplicate
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShare && onShare(document);
                          }}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } flex items-center px-4 py-2 text-sm text-gray-700 
                            dark:text-gray-200 w-full transition-colors`}
                        >
                          <ShareIcon className="mr-3 h-4 w-4" />
                          Share
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                  
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className={`${
                            active ? 'bg-red-50 dark:bg-red-900/20' : ''
                          } flex items-center px-4 py-2 text-sm text-red-600 
                            dark:text-red-400 w-full transition-colors`}
                        >
                          <TrashIcon className="mr-3 h-4 w-4" />
                          Delete
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          {/* Preview Content */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
            {getPreviewText()}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 
                        dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>{formatDate(document.updatedAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <ChartBarIcon className="h-3.5 w-3.5" />
                <span>{wordCount} words</span>
              </div>
            </div>
            
            {/* Visual indicator for recent documents */}
            {new Date() - new Date(document.updatedAt) < 86400000 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 
                             text-green-700 dark:bg-green-900/20 dark:text-green-400 
                             rounded-full">
                Recent
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Document?"
        message={`Are you sure you want to delete "${document.title}"? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}

export default DocumentCard;
