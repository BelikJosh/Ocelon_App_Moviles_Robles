// hooks/useAuthState.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Usuario } from '../services/DynamoService';

export const useAuthState = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [esInvitado, setEsInvitado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarAuthState();
  }, []);

  const cargarAuthState = async () => {
    try {
      const [userData, isGuest] = await Promise.all([
        AsyncStorage.getItem('@user_data'),
        AsyncStorage.getItem('@is_guest'),
      ]);

      console.log('📱 Cargando estado de autenticación...');
      console.log('Usuario data:', userData ? 'Existe' : 'No existe');
      console.log('Es invitado:', isGuest);

      if (userData) {
        const usuarioParseado = JSON.parse(userData);
        setUsuario(usuarioParseado);
        setEsInvitado(false);
        console.log('👤 Usuario cargado:', usuarioParseado.nombre);
      } else if (isGuest === 'true') {
        setUsuario(null);
        setEsInvitado(true);
        console.log('🎭 Modo invitado cargado');
      } else {
        setUsuario(null);
        setEsInvitado(false);
        console.log('🚫 No autenticado');
      }
    } catch (error) {
      console.error('❌ Error cargando auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['@user_data', '@is_guest']);
    setUsuario(null);
    setEsInvitado(false);
    console.log('🚪 Sesión cerrada');
  };

  return {
    usuario,
    esInvitado,
    loading,
    logout,
    refetch: cargarAuthState
  };
};