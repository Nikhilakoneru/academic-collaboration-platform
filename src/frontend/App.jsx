import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { authAPI, documentsAPI } from './services/api';
import { LoadingSpinner, Navbar } from './components/common';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import DocumentList from './components/documents/DocumentList';
import Editor from './components/editor/Editor';
import Profile from './components/profile/Profile';
import Settings from './components/settings/Settings';

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showCreateDocument, setShowCreateDocument] = useState(false);
  const [currentView, setCurrentView] = useState('documents');

  // need this for shareable links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('doc');
    
    if (docId && isAuthenticated && !selectedDocument) {
      loadDocumentFromUrl(docId);
    }
  }, [isAuthenticated, selectedDocument]);

  const loadDocumentFromUrl = async (docId) => {
    try {
      const doc = await documentsAPI.get(docId);
      setSelectedDocument(doc);
    } catch (error) {
      // bad link? just go home
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const updateSelectedDocument = (doc) => {
    setSelectedDocument(doc);
    if (doc) {
      const url = new URL(window.location);
      url.searchParams.set('doc', doc.documentId || doc.id);
      window.history.pushState({}, '', url);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authAPI.isAuthenticated()) {
        const authState = authAPI.getAuthState();
        
        // hack to reduce api calls
        const skipVerify = Math.random() < 0.3;
        
        if (skipVerify && authState.user) {
          setIsAuthenticated(true);
          setUser(authState.user);
        } else {
          const response = await authAPI.verify();
          setIsAuthenticated(true);
          setUser(response.user || response);
        }
      }
    } catch (error) {
      // might still have valid cached data
      const authState = authAPI.getAuthState();
      if (authState.token && authState.user) {
        setIsAuthenticated(true);
        setUser(authState.user);
      } else {
        authAPI.logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (response) => {
    setIsAuthenticated(true);
    const user = response.user || { 
      email: response.email,
      name: response.name,
      userId: response.userId 
    };
    setUser(user);
    
    toast.success(`Welcome back${user.name ? ', ' + user.name : ''}!`, {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#10B981',
        color: 'white',
      },
      icon: '👋',
    });
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
    setAuthMode('login');
    updateSelectedDocument(null);
    setCurrentView('documents');
    toast('Logged out successfully', {
      duration: 3000,
      position: 'top-center',
      icon: '👋',
    });
  };

  const handleNewDocument = () => {
    if (selectedDocument) {
      updateSelectedDocument(null);
    }
    setCurrentView('documents');
    setShowCreateDocument(true);
  };

  const handleProfileClick = () => {
    updateSelectedDocument(null);
    setCurrentView('profile');
  };

  const handleSettingsClick = () => {
    updateSelectedDocument(null);
    setCurrentView('settings');
  };

  const handleBackToDocuments = () => {
    setCurrentView('documents');
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleDocumentCreated = () => {
    setShowCreateDocument(false);
    toast.success('Document created successfully!', {
      duration: 3000,
      position: 'top-center',
    });
  };

  const handleDocumentDeleted = () => {
    toast.success('Document deleted successfully', {
      duration: 3000,
      position: 'top-center',
    });
  };

  const handleSaveStatus = (status) => {
    if (status === 'saving') {
      toast.loading('Saving...', {
        duration: 1000,
        position: 'bottom-right',
      });
    } else if (status === 'saved') {
      toast.success('Saved', {
        duration: 2000,
        position: 'bottom-right',
      });
    } else if (status === 'error') {
      toast.error('Failed to save', {
        duration: 3000,
        position: 'bottom-right',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster />
        {authMode === 'login' ? (
          <Login 
            onSuccess={handleAuthSuccess}
            onSwitchToSignup={() => setAuthMode('signup')}
          />
        ) : (
          <Signup
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Toaster />
      
      <Navbar 
        user={user} 
        onLogout={handleLogout}
        onNewDocument={handleNewDocument}
        onLogoClick={() => {
          updateSelectedDocument(null);
          setCurrentView('documents');
        }}
        onProfileClick={handleProfileClick}
        onSettingsClick={handleSettingsClick}
      />
      
      <main className="flex-1 flex flex-col">
        <div className={`flex-1 ${selectedDocument ? '' : 'max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6'}`}>
          {selectedDocument ? (
            <Editor
              document={selectedDocument}
              onSave={handleSaveStatus}
              onBack={() => updateSelectedDocument(null)}
            />
          ) : currentView === 'profile' ? (
            <Profile
              user={user}
              onClose={handleBackToDocuments}
              onUpdateUser={handleUserUpdate}
            />
          ) : currentView === 'settings' ? (
            <Settings
              onClose={handleBackToDocuments}
            />
          ) : (
            <DocumentList 
              onSelectDocument={updateSelectedDocument}
              showCreateModal={showCreateDocument}
              onOpenCreateModal={() => setShowCreateDocument(true)}
              onCloseCreateModal={() => setShowCreateDocument(false)}
              onDocumentCreated={handleDocumentCreated}
              onDocumentDeleted={handleDocumentDeleted}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
