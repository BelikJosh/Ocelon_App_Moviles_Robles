import { useCallback, useState } from 'react';
import { DynamoDBService, Usuario } from '../services/DynamoService';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    setUsuario(null);
    
    try {
      console.log('🔐 Iniciando proceso de login...');
      
      const resultado = await DynamoDBService.verificarCredenciales(email, password);
      
      if (resultado.success && resultado.usuario) {
        setUsuario(resultado.usuario);
        console.log('✅ Login exitoso');
        return { success: true, usuario: resultado.usuario };
      } else {
        setError(resultado.error || 'Error en el login');
        console.log('❌ Login fallido:', resultado.error);
        return { success: false, error: resultado.error };
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

  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    usuario,
    login,
    limpiarError
  };
};