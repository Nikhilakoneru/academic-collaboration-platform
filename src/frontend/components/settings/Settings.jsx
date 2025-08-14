import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { MoonIcon, SunIcon, ComputerDesktopIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

function Settings({ onClose }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (selectedTheme) => {
    document.documentElement.classList.remove('dark', 'light');
    
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (selectedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // follow system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
    
    localStorage.setItem('theme', selectedTheme);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
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
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize your application preferences
        </p>
      </div>

      {/* Settings Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        {/* Theme Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Appearance
          </h3>
          
          <div className="space-y-2">
            {/* Light Theme */}
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer
                           hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                   style={{
                     borderColor: theme === 'light' ? 'rgb(79 70 229)' : '',
                     backgroundColor: theme === 'light' ? 'rgb(238 242 255 / 0.3)' : ''
                   }}>
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => handleThemeChange('light')}
                className="sr-only"
              />
              <SunIcon className={`h-5 w-5 mr-3 ${
                theme === 'light' ? 'text-primary-600' : 'text-gray-500'
              }`} />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">Light</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Light theme for daytime use
                </p>
              </div>
              {theme === 'light' && (
                <div className="h-2 w-2 rounded-full bg-primary-600" />
              )}
            </label>

            {/* Dark Theme */}
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer
                           hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                   style={{
                     borderColor: theme === 'dark' ? 'rgb(79 70 229)' : '',
                     backgroundColor: theme === 'dark' ? 'rgb(79 70 229 / 0.1)' : ''
                   }}>
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => handleThemeChange('dark')}
                className="sr-only"
              />
              <MoonIcon className={`h-5 w-5 mr-3 ${
                theme === 'dark' ? 'text-primary-600' : 'text-gray-500'
              }`} />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">Dark</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dark theme for reduced eye strain
                </p>
              </div>
              {theme === 'dark' && (
                <div className="h-2 w-2 rounded-full bg-primary-600" />
              )}
            </label>

            {/* System Theme */}
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer
                           hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                   style={{
                     borderColor: theme === 'system' ? 'rgb(79 70 229)' : '',
                     backgroundColor: theme === 'system' ? 'rgb(79 70 229 / 0.1)' : ''
                   }}>
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === 'system'}
                onChange={() => handleThemeChange('system')}
                className="sr-only"
              />
              <ComputerDesktopIcon className={`h-5 w-5 mr-3 ${
                theme === 'system' ? 'text-primary-600' : 'text-gray-500'
              }`} />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">System</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Follow system preference
                </p>
              </div>
              {theme === 'system' && (
                <div className="h-2 w-2 rounded-full bg-primary-600" />
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
