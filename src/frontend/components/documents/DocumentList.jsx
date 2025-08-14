import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { documentsAPI } from '../../services/api';
import useApiCall from '../../hooks/useApiCall';
import CreateDocument from './CreateDocument';
import DocumentCard from './DocumentCard';
import ShareModal from './ShareModal';
import { DocumentSkeleton } from '../common/LoadingSpinner';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, DocumentTextIcon, CalendarDaysIcon,
  ClockIcon, ArrowUpIcon, ArrowDownIcon
} from '@heroicons/react/24/outline';

function DocumentList({ onSelectDocument, showCreateModal, onOpenCreateModal,
  onCloseCreateModal, onDocumentCreated, onDocumentDeleted }) {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [shareDocument, setShareDocument] = useState(null); 
  
  const { loading, error, execute } = useApiCall();
  const deleteApi = useApiCall(); // Separate instance for delete operations

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    await execute(() => documentsAPI.list(), {
      onSuccess: (response) => setDocuments(response.documents || []),
      errorMessage: 'Failed to load documents'
    });
  };

  const handleDocumentCreated = async (document) => {
    await loadDocuments();
    onDocumentCreated();
  };

  const handleDocumentDeleted = async (documentId) => {
    await deleteApi.execute(() => documentsAPI.delete(documentId), {
      onSuccess: () => {
        setDocuments(documents.filter(doc => doc.documentId !== documentId));
        onDocumentDeleted();
      },
      successMessage: 'Document deleted successfully',
      errorMessage: 'Failed to delete document'
    });
  };

  const handleDocumentDuplicated = async (document) => {
    try {
      // Create a copy with new title
      const newTitle = `${document.title} (Copy)`;
      const newDoc = await documentsAPI.create(newTitle, document.content || '');
      await loadDocuments();
      toast.success('Document duplicated successfully!');
    } catch (err) {
      toast.error('Failed to duplicate document');
    }
  };

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(query) ||
        doc.content?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default: // updatedAt
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return <DocumentSkeleton />;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          Error loading documents
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <button
          onClick={loadDocuments}
          className="mt-4 btn btn-primary btn-sm"
        >
          Try again
        </button>
      </motion.div>
    );
  }

  return (
    <>
      {/* title and doc count */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Your Documents
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'} in your library
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={onOpenCreateModal}  // Use correct function to open modal
              className="btn btn-primary btn-md flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              New Document
            </button>
          </div>
        </div>

        {/* search box and filter button */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="input-field pl-10"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              className="btn btn-secondary btn-md flex items-center gap-2"
            >
              <FunnelIcon className="h-5 w-5" />
              Sort & Filter
            </button>
            
            {/* dropdown menu for sorting */}
            <AnimatePresence>
              {filterMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 
                           shadow-lg ring-1 ring-black ring-opacity-5 z-10"
                >
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Sort by
                      </h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => toggleSort('updatedAt')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between
                                    ${sortBy === 'updatedAt' 
                                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                        >
                          <span className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4" />
                            Last Modified
                          </span>
                          {sortBy === 'updatedAt' && (
                            sortOrder === 'desc' ? 
                              <ArrowDownIcon key="down" className="h-4 w-4" /> : 
                              <ArrowUpIcon key="up" className="h-4 w-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => toggleSort('createdAt')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between
                                    ${sortBy === 'createdAt' 
                                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                        >
                          <span className="flex items-center gap-2">
                            <CalendarDaysIcon className="h-4 w-4" />
                            Date Created
                          </span>
                          {sortBy === 'createdAt' && (
                            sortOrder === 'desc' ? 
                              <ArrowDownIcon key="down" className="h-4 w-4" /> : 
                              <ArrowUpIcon key="up" className="h-4 w-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => toggleSort('title')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between
                                    ${sortBy === 'title' 
                                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                        >
                          <span className="flex items-center gap-2">
                            <DocumentTextIcon className="h-4 w-4" />
                            Title
                          </span>
                          {sortBy === 'title' && (
                            sortOrder === 'desc' ? 
                              <ArrowDownIcon key="down" className="h-4 w-4" /> : 
                              <ArrowUpIcon key="up" className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* show docs or empty message */}
      {filteredDocuments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
              <path
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 3v5a2 2 0 002 2h5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {searchQuery ? 'No documents found' : 'No documents yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery 
              ? 'Try adjusting your search query' 
              : 'Get started by creating your first document'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={() => onCloseCreateModal(false)}
              className="mt-4 btn btn-primary btn-md inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Document
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          style={{ zIndex: 1 }}
        >
          <AnimatePresence>
            {filteredDocuments.map((document, index) => (
              <motion.div
                key={document.documentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
                style={{ zIndex: 10 }}
              >
                <DocumentCard
                  document={document}
                  onSelect={() => onSelectDocument(document)}
                  onDelete={() => handleDocumentDeleted(document.documentId)}
                  onShare={(doc) => setShareDocument(doc)}
                  onDuplicate={handleDocumentDuplicated}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create Document Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateDocument
            onClose={onCloseCreateModal}
            onDocumentCreated={handleDocumentCreated}
          />
        )}
      </AnimatePresence>

      {/* Share Document Modal */}
      <AnimatePresence>
        {shareDocument && (
          <ShareModal
            document={shareDocument}
            onClose={() => {
              setShareDocument(null);
              loadDocuments(); 
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default DocumentList;
