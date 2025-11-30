// services/BiometricService.ts
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class BiometricService {
  // Verificar si el dispositivo soporta biometría
  static async isBiometricAvailable(): Promise<{
    available: boolean;
    type?: string;
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        return { available: false };
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      let type = 'biometric';
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        type = 'fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        type = 'face';
      }

      return { available: true, type };
    } catch (error) {
      console.error('Error verificando biometría:', error);
      return { available: false };
    }
  }

  // Autenticar con biometría
  static async authenticateWithBiometrics(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentícate para acceder a Ocelon',
        fallbackLabel: 'Usar contraseña',
        disableDeviceFallback: false,
      });

      return {
        success: result.success,
        error: result.success ? undefined : 'Autenticación biométrica fallida'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Guardar credenciales para biometría
  static async saveCredentialsForBiometrics(email: string, password: string): Promise<void> {
    try {
      // En una app real, deberías encriptar estas credenciales
      const credentials = JSON.stringify({ email, password });
      await AsyncStorage.setItem('@biometric_credentials', credentials);
      await AsyncStorage.setItem('@biometric_enabled', 'true');
      console.log('🔐 Credenciales biométricas guardadas');
    } catch (error) {
      console.error('Error guardando credenciales biométricas:', error);
    }
  }

  // Obtener credenciales guardadas
  static async getBiometricCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      const credentials = await AsyncStorage.getItem('@biometric_credentials');
      if (!credentials) return null;

      return JSON.parse(credentials);
    } catch (error) {
      console.error('Error obteniendo credenciales biométricas:', error);
      return null;
    }
  }

  // Verificar si la biometría está habilitada
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('@biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  // Deshabilitar biometría
  static async disableBiometrics(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['@biometric_credentials', '@biometric_enabled']);
      console.log('🔐 Biometría deshabilitada');
    } catch (error) {
      console.error('Error deshabilitando biometría:', error);
    }
  }
}