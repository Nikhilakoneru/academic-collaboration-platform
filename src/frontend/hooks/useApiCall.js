// try catch everywhere so this handles the loading/error states
// just pass an api function and it deals with the rest
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export default function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      successMessage, 
      errorMessage,
      showErrorToast = true 
    } = options;

    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction();
      
      // Show success message if provided
      if (successMessage) {
        toast.success(successMessage);
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const message = err.message || errorMessage || 'Something went wrong';
      setError(message);
      
      // Show error toast by default
      if (showErrorToast) {
        toast.error(message);
      }
      
      // Call error callback if provided
      if (onError) {
        onError(err);
      }
      
      throw err; // Re throw for component specific handling if needed
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    execute
  };
}
