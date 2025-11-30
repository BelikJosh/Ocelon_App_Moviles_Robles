// hooks/useLogin.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { DynamoDBService, Usuario } from '../services/DynamoService';
import { FirebaseService } from '../services/FirebaseService';
import { BiometricService } from '../services/BiometricService';
import { Alert } from 'react-native';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const login = useCallback(async (email: string, password: string, saveBiometric: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Iniciando proceso de login...');

      // Verificar que Firebase esté inicializado
      if (!FirebaseService.isInitialized()) {
        const errorMsg = 'Error de configuración: Firebase no está inicializado';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      // Primero autenticar con Firebase
      const firebaseResult = await FirebaseService.signInWithEmail(email, password);
      
      if (!firebaseResult.success) {
        setError(firebaseResult.error || 'Error en autenticación Firebase');
        return { success: false, error: firebaseResult.error };
      }

      // Luego verificar con DynamoDB (si es necesario)
      // Si no usas DynamoDB para autenticación, puedes omitir esta parte
      let dynamoResult;
      try {
        dynamoResult = await DynamoDBService.verificarCredenciales(email, password);
      } catch (dynamoError) {
        console.log('⚠️ DynamoDB no disponible, continuando con Firebase...');
        // Si DynamoDB falla, continuamos con la autenticación de Firebase
        dynamoResult = { 
          success: true, 
          usuario: { 
            id: firebaseResult.user?.uid || '',
            email: email,
            nombre: email.split('@')[0], // Nombre por defecto
            fechaCreacion: new Date().toISOString(),
          } 
        };
      }
      
      if (dynamoResult.success && dynamoResult.usuario) {
        setUsuario(dynamoResult.usuario);
        
        // Guardar usuario en AsyncStorage
        await AsyncStorage.setItem('@user_data', JSON.stringify(dynamoResult.usuario));
        await AsyncStorage.removeItem('@is_guest');
        
        // Guardar credenciales para biometría si se solicita
        if (saveBiometric) {
          await BiometricService.saveCredentialsForBiometrics(email, password);
        }
        
        console.log('✅ Login exitoso');
        return { success: true, usuario: dynamoResult.usuario };
      } else {
        const errorMsg = dynamoResult.error || 'Error en la verificación de credenciales';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      console.error('💥 Error en hook de login:', err);
      const errorMessage = err.message || 'Error desconocido al iniciar sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Login con Google
  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Iniciando sesión con Google...');
      
      const result = await FirebaseService.signInWithGoogle();
      
      if (result.success) {
        // Aquí procesarías el usuario de Google
        const usuarioGoogle: Usuario = {
          id: result.user?.uid || 'google-user',
          email: result.user?.email || 'usuario@google.com',
          nombre: result.user?.displayName || 'Usuario Google',
          fechaCreacion: new Date().toISOString(),
        };
        
        setUsuario(usuarioGoogle);
        await AsyncStorage.setItem('@user_data', JSON.stringify(usuarioGoogle));
        await AsyncStorage.removeItem('@is_guest');
        
        console.log('✅ Login con Google exitoso');
        return { success: true, usuario: usuarioGoogle };
      } else {
        setError(result.error || 'Error en autenticación con Google');
        return { success: false, error: result.error };
      }
      
    } catch (err: any) {
      console.error('💥 Error en login con Google:', err);
      const errorMessage = err.message || 'Error desconocido al iniciar sesión con Google';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Login con biometría
  const loginWithBiometrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Iniciando sesión con biometría...');
      
      // Verificar disponibilidad
      const biometricAvailable = await BiometricService.isBiometricAvailable();
      if (!biometricAvailable.available) {
        const errorMsg = 'La autenticación biométrica no está disponible en este dispositivo';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      // Autenticar con biometría
      const authResult = await BiometricService.authenticateWithBiometrics();
      if (!authResult.success) {
        const errorMsg = authResult.error || 'Autenticación biométrica fallida o cancelada';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      // Obtener credenciales guardadas
      const credentials = await BiometricService.getBiometricCredentials();
      if (!credentials) {
        const errorMsg = 'No hay credenciales guardadas para biometría';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      // Hacer login normal con las credenciales
      console.log('🔐 Credenciales biométricas encontradas, procediendo con login...');
      return await login(credentials.email, credentials.password, false);
      
    } catch (err: any) {
      console.error('💥 Error en login con biometría:', err);
      const errorMessage = err.message || 'Error en autenticación biométrica';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [login]);

  // Verificar si puede usar biometría
  const canUseBiometrics = useCallback(async (): Promise<{
    available: boolean;
    enabled: boolean;
    type?: string;
  }> => {
    try {
      const biometricAvailable = await BiometricService.isBiometricAvailable();
      const biometricEnabled = await BiometricService.isBiometricEnabled();
      
      return {
        available: biometricAvailable.available,
        enabled: biometricEnabled,
        type: biometricAvailable.type
      };
    } catch (error) {
      console.error('Error verificando biometría:', error);
      return { available: false, enabled: false };
    }
  }, []);

  const entrarComoInvitado = useCallback(async () => {
    await AsyncStorage.setItem('@is_guest', 'true');
    await AsyncStorage.removeItem('@user_data');
    await BiometricService.disableBiometrics();
    console.log('🎭 Modo invitado activado');
  }, []);

  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    usuario,
    login,
    loginWithGoogle,
    loginWithBiometrics,
    canUseBiometrics,
    entrarComoInvitado,
    limpiarError
  };
};