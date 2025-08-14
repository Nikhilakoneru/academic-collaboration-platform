import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import useApiCall from '../../hooks/useApiCall';
import LoadingSpinner from '../common/LoadingSpinner';
import { EnvelopeIcon, LockClosedIcon, UserIcon, EyeIcon, 
  EyeSlashIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon,
  ShieldCheckIcon} from '@heroicons/react/24/outline';

function Signup({ onSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Use hook for API calls which eliminates the try catch loading boilerplate
  const { loading, error, execute } = useApiCall();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    const isLongEnough = password.length >= 8;
    
    return {
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isLongEnough,
      isValid: hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough
    };
  };

  const validateField = (field, value) => {
    const errors = { ...fieldErrors };
    
    switch (field) {
      case 'name':
        if (!value) {
          errors.name = 'Name is required';
        } else if (value.length < 2) {
          errors.name = 'Name must be at least 2 characters';
        } else {
          delete errors.name;
        }
        break;
        
      case 'email':
        if (!value) {
          errors.email = 'Email is required';
        } else if (!validateEmail(value)) {
          errors.email = 'Please enter a valid email';
        } else {
          delete errors.email;
        }
        break;
        
      case 'password':
        const validation = validatePassword(value);
        if (!value) {
          errors.password = 'Password is required';
        } else if (!validation.isValid) {
          errors.password = 'Password must meet all requirements';
        } else {
          delete errors.password;
        }
        
        // Also validate confirm password if it has been touched
        if (touched.confirmPassword && formData.confirmPassword !== value) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;
    }
    
    setFieldErrors(errors);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field, formData[field]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      validateField(field, formData[field]);
    });
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }
    
    // Use the hook instead of manual try-catch-loading
    await execute(
      () => authAPI.signup(formData.email, formData.password, formData.name),
      {
        onSuccess: (response) => onSuccess(response),
        errorMessage: 'Failed to create account'
      }
    );
  };

  const passwordValidation = validatePassword(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 
                    dark:from-gray-900 dark:to-gray-800 px-4 sm:px-6 lg:px-8 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Logo and Title */}
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
            Create your account
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Join the academic collaboration platform
          </p>
        </div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="input-label">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className={`h-5 w-5 ${
                    touched.name && fieldErrors.name 
                      ? 'text-red-400' 
                      : 'text-gray-400'
                  }`} />
                </div>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`input-field pl-10 pr-10 ${
                    touched.name && fieldErrors.name ? 'input-error' : ''
                  }`}
                  placeholder="John Doe"
                  autoComplete="name"
                />
                {touched.name && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {fieldErrors.name ? (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    ) : formData.name && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {touched.name && fieldErrors.name && (
                <p className="input-error-message">
                  <XCircleIcon className="h-4 w-4" />
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
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
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
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
                    ) : formData.email && (
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

            {/* Password Field */}
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
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`input-field pl-10 pr-10 ${
                    touched.password && fieldErrors.password ? 'input-error' : ''
                  }`}
                  placeholder="••••••••"
                  autoComplete="new-password"
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
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2"
              >
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 
                           flex items-center gap-1">
                  <ShieldCheckIcon className="h-4 w-4" />
                  Password requirements:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1 ${
                    passwordValidation.isLongEnough ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {passwordValidation.isLongEnough ? 
                      <CheckCircleIcon className="h-3 w-3" /> : 
                      <div className="h-3 w-3 rounded-full border border-current" />
                    }
                    8+ characters
                  </div>
                  <div className={`flex items-center gap-1 ${
                    passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {passwordValidation.hasUpperCase ? 
                      <CheckCircleIcon className="h-3 w-3" /> : 
                      <div className="h-3 w-3 rounded-full border border-current" />
                    }
                    Uppercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${
                    passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {passwordValidation.hasLowerCase ? 
                      <CheckCircleIcon className="h-3 w-3" /> : 
                      <div className="h-3 w-3 rounded-full border border-current" />
                    }
                    Lowercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${
                    passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {passwordValidation.hasNumbers ? 
                      <CheckCircleIcon className="h-3 w-3" /> : 
                      <div className="h-3 w-3 rounded-full border border-current" />
                    }
                    Number
                  </div>
                  <div className={`flex items-center gap-1 ${
                    passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {passwordValidation.hasSpecialChar ? 
                      <CheckCircleIcon className="h-3 w-3" /> : 
                      <div className="h-3 w-3 rounded-full border border-current" />
                    }
                    Special character
                  </div>
                </div>
              </motion.div>
            )}

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="input-label">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className={`h-5 w-5 ${
                    touched.confirmPassword && fieldErrors.confirmPassword 
                      ? 'text-red-400' 
                      : 'text-gray-400'
                  }`} />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`input-field pl-10 pr-10 ${
                    touched.confirmPassword && fieldErrors.confirmPassword ? 'input-error' : ''
                  }`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p className="input-error-message">
                  <XCircleIcon className="h-4 w-4" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Error Message */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || Object.keys(fieldErrors).length > 0}
              className="w-full btn btn-primary btn-lg"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mx-auto" />
              ) : (
                'Create account'
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-medium text-primary-600 hover:text-primary-700 
                           dark:text-primary-400 dark:hover:text-primary-300 
                           transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Signup;
