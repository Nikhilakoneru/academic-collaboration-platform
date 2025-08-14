import React, { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  DocumentTextIcon, 
  UserCircleIcon, 
  CogIcon, 
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

function Navbar({ user, onLogout, onNewDocument, onLogoClick, onProfileClick, onSettingsClick }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* logo and new doc button */}
          <div className="flex items-center">
            <button 
              onClick={onLogoClick}
              className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity"
            >
              <DocumentTextIcon className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                AcademicCollab
              </h1>
            </button>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <button
                onClick={onNewDocument}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                New Document
              </button>
            </div>
          </div>

          {/* user stuff */}
          <div className="flex items-center space-x-3">
            {/* dropdown with profile, settings and logout */}
            <Menu as="div" className="relative hidden md:block">
              <Menu.Button className="flex items-center space-x-3 p-2 rounded-lg 
                                    hover:bg-gray-100 dark:hover:bg-gray-700 
                                    transition-colors group">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center 
                              justify-center text-white font-medium text-sm">
                  {userInitials}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 
                                          dark:group-hover:text-gray-300" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 rounded-lg bg-white 
                                     dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 
                                     focus:outline-none divide-y divide-gray-100 dark:divide-gray-700">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={onProfileClick}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } flex items-center px-4 py-2 text-sm text-gray-700 
                            dark:text-gray-200 transition-colors w-full`}
                        >
                          <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" />
                          Your Profile
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={onSettingsClick}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } flex items-center px-4 py-2 text-sm text-gray-700 
                            dark:text-gray-200 transition-colors w-full`}
                        >
                          <CogIcon className="mr-3 h-5 w-5 text-gray-400" />
                          Settings
                        </button>
                      )}
                    </Menu.Item>
                  </div>

                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={onLogout}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } flex items-center w-full px-4 py-2 text-sm text-gray-700 
                            dark:text-gray-200 transition-colors`}
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 
                       dark:text-gray-400 dark:hover:text-gray-200 
                       hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <Transition
        show={isMobileMenuOpen}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 -translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-1"
      >
        <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 
                      dark:border-gray-700">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <button
              onClick={onNewDocument}
              className="w-full btn btn-primary btn-md flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              New Document
            </button>
          </div>
          
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center 
                            justify-center text-white font-medium">
                {userInitials}
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                  {user?.name || 'User'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <div className="mt-3 space-y-1">
              <button
                onClick={onProfileClick}
                className="block w-full text-left px-3 py-2 rounded-md text-base 
                         font-medium text-gray-700 dark:text-gray-200 
                         hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Your Profile
              </button>
              <button
                onClick={onSettingsClick}
                className="block w-full text-left px-3 py-2 rounded-md text-base 
                         font-medium text-gray-700 dark:text-gray-200 
                         hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Settings
              </button>
              <button
                onClick={onLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base 
                         font-medium text-gray-700 dark:text-gray-200 
                         hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </nav>
  );
}

export default Navbar;
