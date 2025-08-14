import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { documentsAPI, websocketAPI, authAPI } from '../../services/api';
import { EditorSkeleton } from '../common/LoadingSpinner';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import { ArrowLeftIcon, CheckIcon, XMarkIcon,
  CloudArrowUpIcon, DocumentTextIcon, UserGroupIcon } from '@heroicons/react/24/outline';

// Quill toolbar config
const TOOLBAR_OPTIONS = [
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'font': [] }],
  [{ 'size': ['small', false, 'large', 'huge'] }],
  
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'color': [] }, { 'background': [] }],
  
  [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
  [{ 'indent': '-1'}, { 'indent': '+1' }],
  [{ 'align': [] }],
  
  ['blockquote', 'code-block'],
  ['link', 'image', 'video'],
  
  ['clean']
];

function Editor({ document, onSave, onBack }) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const changeHandlerRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [collaborators, setCollaborators] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [documentContent, setDocumentContent] = useState(document.content || '');

  // Load document on mount or when ID changes
  useEffect(() => {
    const loadDocumentContent = async () => {
      // Always try to load the full document to ensure we have the latest content
      if (document.documentId) {
        try {
          const fullDocument = await documentsAPI.get(document.documentId);
          setDocumentContent(fullDocument.content || '');
          setLoading(false);
        } catch (error) {
          
          // auth might have expired
          if (error.message.includes('authentication') || error.message.includes('login')) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error('Failed to load document. Please try again.');
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
      }
    };
    
    loadDocumentContent();
  }, [document.documentId]);

  // Setup Quill editor once content is loaded
  useEffect(() => {
    if (!editorRef.current || quillRef.current || loading) return;

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: TOOLBAR_OPTIONS,
          handlers: {
            // Custom handlers
          }
        },
        history: {
          delay: 1000,
          maxStack: 500,
          userOnly: true
        }
      },
      placeholder: 'Start writing your document...',
      scrollingContainer: '.editor-scroll-container'
    });

    quillRef.current = quill;

    if (documentContent) {
      quill.root.innerHTML = documentContent;
      updateCounts(quill.getText());
    }

    setLoading(false);
  }, [documentContent, loading]);

  const updateCounts = useCallback((text) => {
    const trimmedText = text.trim();
    const words = trimmedText.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(trimmedText.length);
  }, []);

  // watch for content changes and save them
  useEffect(() => {
    if (!quillRef.current) return;

    const quill = quillRef.current;

    const handleChange = (delta, oldDelta, source) => {
      if (source === 'user') {
        updateCounts(quill.getText());
        debouncedSave();
        
        websocketAPI.sendDocumentUpdate(
          document.documentId,
          quill.root.innerHTML,
          quill.getSelection()?.index || 0
        );
      }
    };

    changeHandlerRef.current = handleChange;
    quill.on('text-change', handleChange);

    return () => {
      quill.off('text-change', handleChange);
    };
  }, [document.documentId]);

  // auto save with 1 second delay
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');
    onSave('saving');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const content = quillRef.current.root.innerHTML;
        await documentsAPI.update(document.documentId, {
          title: document.title,
          content: content
        });
        setSaveStatus('saved');
        onSave('saved');
      } catch (error) {
        setSaveStatus('error');
        onSave('error');
      }
    }, 1000);
  }, [document.documentId, document.title, onSave]);

  const handleManualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    debouncedSave();
  }, [debouncedSave]);

  // Ctrl+S to save
  useKeyboardShortcuts([
    { key: 's', ctrlKey: true, action: handleManualSave }
  ]);

  // Connect to WebSocket for collaboration
  useEffect(() => {
    // Connect to WebSocket
    websocketAPI.connect();
    
    // Set up message handlers
    const handleUpdate = (message) => {
      if (message.documentId === document.documentId && message.userId !== 'current-user') {
        // Apply remote changes
        if (quillRef.current && message.delta) {
          quillRef.current.updateContents(message.delta, 'api');
        }
      }
    };
    
    const handleCollaborators = (message) => {
      if (message.documentId === document.documentId) {
        setCollaborators(message.users || []);
      }
    };
    const handleConnectionChange = (status) => {
      setConnectionStatus(status);
    };
    
    // Register handlers
    websocketAPI.on('update', handleUpdate);
    websocketAPI.on('collaborators', handleCollaborators);
    websocketAPI.on('connection_change', handleConnectionChange);
    
    // Join document
    websocketAPI.joinDocument(document.documentId);
    
    // Cleanup
    return () => {
      websocketAPI.off('update', handleUpdate);
      websocketAPI.off('collaborators', handleCollaborators);
      websocketAPI.off('connection_change', handleConnectionChange);
      websocketAPI.leaveDocument(document.documentId);
    };
  }, [document.documentId]);

  if (loading) {
    return <EditorSkeleton />;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 border-b border-gray-200 
                   dark:border-gray-700 px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                       dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 
                       rounded-lg transition-colors"
              aria-label="Back to documents"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 
                           truncate max-w-md">
                {document.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${
                connectionStatus === 'connected' 
                  ? 'bg-green-500 animate-pulse-subtle' 
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {connectionStatus === 'connected' 
                  ? `${collaborators.length || 1} online`
                  : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Offline'
                }
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {saveStatus === 'saving' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400"
                >
                  <CloudArrowUpIcon className="h-5 w-5 animate-bounce" />
                  <span className="text-sm">Saving...</span>
                </motion.div>
              )}
              {saveStatus === 'saved' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 text-green-600 dark:text-green-400"
                >
                  <CheckIcon className="h-5 w-5" />
                  <span className="text-sm">Saved</span>
                </motion.div>
              )}
              {saveStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2 text-red-600 dark:text-red-400"
                >
                  <XMarkIcon className="h-5 w-5" />
                  <span className="text-sm">Error saving</span>
                </motion.div>
              )}
            </div>

            {/* save button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleManualSave}
                className="btn btn-primary btn-sm"
                disabled={saveStatus === 'saving'}
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* stats on mobile view */}
        <div className="lg:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-500 
                        dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <UserGroupIcon className="h-4 w-4" />
                <span>{collaborators.length || 1} online</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* main editor area */}
      <div className="flex-1 overflow-hidden editor-scroll-container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="h-full bg-white dark:bg-gray-800"
        >
          <div 
            ref={editorRef}
            className="h-full"
            style={{
              fontSize: '16px',
              lineHeight: '1.75'
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
export default Editor;
