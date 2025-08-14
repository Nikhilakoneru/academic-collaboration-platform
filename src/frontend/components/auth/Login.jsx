import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import useApiCall from '../../hooks/useApiCall';
import LoadingSpinner from '../common/LoadingSpinner';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon,
  DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function Login({ onSuccess, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Use hook for API calls which eliminates the try catch loading boilerplate
  const { loading, error, execute } = useApiCall();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateField = (field, value) => {
    const errors = { ...fieldErrors };
    
    if (field === 'email') {
      if (!value) {
        errors.email = 'Email is required';
      } else if (!validateEmail(value)) {
        errors.email = 'Please enter a valid email';
      } else {
        delete errors.email;
      }
    }
    
    if (field === 'password') {
      if (!value) {
        errors.password = 'Password is required';
      } else if (value.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      } else {
        delete errors.password;
      }
    }
    
    setFieldErrors(errors);
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field, field === 'email' ? email : password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    validateField('email', email);
    validateField('password', password);
    setTouched({ email: true, password: true });
    
    if (!email || !password || Object.keys(fieldErrors).length > 0) {
      return;
    }
    
    await execute(
      () => authAPI.login(email, password),
      {
        onSuccess: (response) => onSuccess(response),
        errorMessage: 'Invalid email or password'
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 
                    dark:from-gray-900 dark:to-gray-800 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* branding stuff */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center justify-center"
          >
            <DocumentTextIcon className="h-12 w-12 text-primary-600" />
          </motion.div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        {/* login form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          id="login-form"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* email input */}
            <div>
              <label htmlFor="email" className="input-label">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className={`h-5 w-5 ${
                    touched.email && fieldErrors.email 
                      ? 'text-red-400' 
                      : 'text-gray-400'
                  }`} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) validateField('email', e.target.value);
                  }}
                  onBlur={() => handleBlur('email')}
                  className={`input-field pl-10 pr-10 ${
                    touched.email && fieldErrors.email ? 'input-error' : ''
                  }`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {touched.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {fieldErrors.email ? (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    ) : email && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {touched.email && fieldErrors.email && (
                <p className="input-error-message">
                  <XCircleIcon className="h-4 w-4" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* password input */}
            <div>
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className={`h-5 w-5 ${
                    touched.password && fieldErrors.password 
                      ? 'text-red-400' 
                      : 'text-gray-400'
                  }`} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) validateField('password', e.target.value);
                  }}
                  onBlur={() => handleBlur('password')}
                  className={`input-field pl-10 pr-10 ${
                    touched.password && fieldErrors.password ? 'input-error' : ''
                  }`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="input-error-message">
                  <XCircleIcon className="h-4 w-4" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* error display if login fails */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 
                         dark:border-red-800 rounded-lg p-4"
              >
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <XCircleIcon className="h-5 w-5" />
                  {error}
                </p>
              </motion.div>
            )}

            {/* the login button */}
            <button
              type="submit"
              disabled={loading || Object.keys(fieldErrors).length > 0}
              className="w-full btn btn-primary btn-lg"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mx-auto" />
              ) : (
                'Sign in'
              )}
            </button>

            {/* dev mode test account info */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm">
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                Test Credentials:
              </p>
              <p className="text-gray-500 dark:text-gray-500">
                Email: test@example.com<br />
                Password: Test123!
              </p>
            </div>

            {/* link to signup page */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignup}
                  className="font-medium text-primary-600 hover:text-primary-700 
                           dark:text-primary-400 dark:hover:text-primary-300 
                           transition-colors"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;
