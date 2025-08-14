import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { documentsAPI } from '../../services/api';
import useApiCall from '../../hooks/useApiCall';
import LoadingSpinner from '../common/LoadingSpinner';
import { XMarkIcon, DocumentTextIcon, DocumentPlusIcon, SparklesIcon } from '@heroicons/react/24/outline';

function CreateDocument({ onClose, onDocumentCreated }) {
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const { loading: creating, error, execute } = useApiCall();

  const templates = [
    { id: 'blank', name: 'Blank Document', icon: DocumentTextIcon },
    { id: 'research', name: 'Research Paper', icon: SparklesIcon },
    { id: 'proposal', name: 'Project Proposal', icon: DocumentPlusIcon },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return; // The hook will handle error display
    }
    
    // Use the hook instead of manual try-catch-loading
    await execute(
      () => documentsAPI.create(title.trim(), getTemplateContent(selectedTemplate)),
      {
        onSuccess: (document) => {
          onDocumentCreated(document);
          onClose();
        },
        errorMessage: 'Failed to create document'
      }
    );
  };

  const getTemplateContent = (template) => {
    switch (template) {
      case 'research':
        return '<h1>Abstract</h1><p></p><h2>Introduction</h2><p></p><h2>Methodology</h2><p></p><h2>Results</h2><p></p><h2>Discussion</h2><p></p><h2>Conclusion</h2><p></p><h2>References</h2><p></p>';
      case 'proposal':
        return '<h1>Executive Summary</h1><p></p><h2>Project Overview</h2><p></p><h2>Objectives</h2><p></p><h2>Timeline</h2><p></p><h2>Budget</h2><p></p><h2>Expected Outcomes</h2><p></p>';
      default:
        return '<p></p>';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl 
                   shadow-xl transform transition-all"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 
                        dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Create New Document
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                       hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Document Title */}
            <div className="mb-6">
              <label htmlFor="title" className="input-label">
                Document Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`input-field ${error && !title.trim() ? 'input-error' : ''}`}
                placeholder="Enter document title..."
                autoFocus
              />
              {error && !title.trim() && (
                <p className="input-error-message mt-1">
                  {error}
                </p>
              )}
            </div>

            {/* Template Selection */}
            <div className="mb-6">
              <label className="input-label mb-3">
                Choose a Template
              </label>
              <div className="grid grid-cols-3 gap-3">
                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200
                                ${selectedTemplate === template.id
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${
                        selectedTemplate === template.id
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-400'
                      }`} />
                      <p className={`text-xs font-medium ${
                        selectedTemplate === template.id
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {template.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && title.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 
                         dark:border-red-800 rounded-lg p-3"
              >
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !title.trim()}
                className="flex-1 btn btn-primary btn-md"
              >
                {creating ? (
                  <LoadingSpinner size="sm" className="mx-auto" />
                ) : (
                  'Create Document'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default CreateDocument;
