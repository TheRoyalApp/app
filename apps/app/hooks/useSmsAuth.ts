import { useState } from 'react';
import { AuthService } from '@/services';
import { setItem, deleteItem } from '@/helpers/secureStore';

export const useSmsAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendSmsCode = async (phone: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('=== SMS AUTH: Sending SMS ===');
      console.log('Phone:', phone);
      
      // Set flags immediately to prevent AuthContext interference
      await setItem('smsProcessActive', 'true');
      await setItem('tempPhone', phone);
      await setItem('smsVerificationInProgress', 'true');
      
      const response = await AuthService.sendSmsCode({ phone });
      console.log('SMS response:', response);
      
      if (response.success) {
        console.log('SMS sent successfully');
        return true;
      } else {
        console.log('SMS send failed:', response.error);
        // Clear flags on failure
        await deleteItem('smsProcessActive');
        await deleteItem('tempPhone');
        await deleteItem('smsVerificationInProgress');
        return false;
      }
    } catch (error) {
      console.error('SMS send error:', error);
      // Clear flags on error
      await deleteItem('smsProcessActive');
      await deleteItem('tempPhone');
      await deleteItem('smsVerificationInProgress');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifySmsCode = async (phone: string, code: string): Promise<{ success: boolean; hasTemporaryData?: boolean }> => {
    try {
      setIsLoading(true);
      console.log('=== SMS AUTH: Verifying code ===');
      console.log('Phone:', phone);
      console.log('Code:', code);
      
      const response = await AuthService.verifySmsCode({ phone, code });
      console.log('Verification response:', response);
      
      if (response.success && response.data) {
        console.log('SMS code verified successfully');
        console.log('User has temporary data:', response.data.hasTemporaryData);
        
        // If user has temporary data, don't try to login - they need to complete signup
        if (response.data.hasTemporaryData) {
          console.log('User has temporary data, needs to complete signup');
          return { success: false, hasTemporaryData: true };
        }
        
        // After successful verification, try to sign in the user
        console.log('Attempting to login after SMS verification...');
        const loginResponse = await AuthService.login({ phone, password: '' });
        console.log('Login response after SMS verification:', loginResponse);
        
        if (loginResponse.success && loginResponse.data) {
          console.log('Login successful after SMS verification');
          // Clear all SMS flags on successful login
          await deleteItem('smsProcessActive');
          await deleteItem('tempPhone');
          await deleteItem('smsVerificationInProgress');
          return { success: true };
        } else {
          // If login fails, check if it's because of temporary data
          console.log('Login failed after verification, login error:', loginResponse.error);
          
          // Check if the error indicates temporary data
          const isTemporaryDataError = loginResponse.error?.includes('complete your registration') || 
                                     loginResponse.error?.includes('temporary');
          
          if (isTemporaryDataError) {
            console.log('Login failed due to temporary data, user needs to complete signup');
            return { success: false, hasTemporaryData: true };
          }
          
          return { success: false };
        }
      }
      console.log('Failed to verify SMS code:', response.error);
      return { success: false };
    } catch (error) {
      console.error('Error verifying SMS code:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const clearSmsFlags = async () => {
    try {
      await deleteItem('smsProcessActive');
      await deleteItem('tempPhone');
      await deleteItem('smsVerificationInProgress');
      console.log('SMS flags cleared');
    } catch (error) {
      console.error('Error clearing SMS flags:', error);
    }
  };

  return {
    sendSmsCode,
    verifySmsCode,
    clearSmsFlags,
    isLoading
  };
}; 