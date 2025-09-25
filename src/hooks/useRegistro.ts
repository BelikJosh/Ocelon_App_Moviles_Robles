import { useCallback, useState } from 'react';
import { DynamoDBService } from '../services/DynamoService';

export const useRegistro = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const registrarUsuario = useCallback(async (usuarioData: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
  }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      console.log('📝 Iniciando registro de usuario...');
      
      const resultado = await DynamoDBService.crearUsuario(usuarioData);
      console.log('🎉 Usuario registrado exitosamente');
      
      setSuccess(true);
      return resultado;
      
    } catch (err: any) {
      console.error('❌ Error en hook de registro:', err);
      const errorMessage = err.message || 'Error desconocido al registrar usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const limpiarEstado = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    registrarUsuario,
    limpiarEstado
  };
};