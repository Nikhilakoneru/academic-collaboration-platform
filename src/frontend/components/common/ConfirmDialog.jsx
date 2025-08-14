import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning'
}) {
  if (!isOpen) return null;

  const variants = {
    warning: {
      icon: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
      button: 'btn-primary'
    },
    danger: {
      icon: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      button: 'btn-danger'
    },
    info: {
      icon: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      button: 'btn-primary'
    }
  };

  const currentVariant = variants[variant] || variants.warning;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl 
                     shadow-xl transform transition-all"
          >
            <div className="p-6">
              {/* Icon */}
              <div className={`mx-auto flex h-12 w-12 items-center justify-center 
                            rounded-full ${currentVariant.icon}`}>
                <ExclamationTriangleIcon className="h-6 w-6" />
              </div>

              {/* Content */}
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 btn btn-secondary btn-md"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 btn ${currentVariant.button} btn-md`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>,
    document.body  
  );
}

export default ConfirmDialog;
