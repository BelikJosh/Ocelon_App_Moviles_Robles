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

  // ✅ NUEVA FUNCIÓN: Actualizar usuario localmente
  const actualizarUsuarioLocal = async (nuevoUsuario: Usuario | Partial<Usuario>) => {
    try {
      console.log('🔄 Actualizando usuario localmente...');
      
      let usuarioActualizado: Usuario;
      
      if (usuario) {
        // Combinar el usuario actual con los nuevos datos
        usuarioActualizado = {
          ...usuario,
          ...nuevoUsuario,
          ultimaActualizacion: new Date().toISOString()
        } as Usuario;
      } else {
        // Si no hay usuario previo, crear uno nuevo
        usuarioActualizado = nuevoUsuario as Usuario;
      }
      
      // Actualizar estado
      setUsuario(usuarioActualizado);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('@user_data', JSON.stringify(usuarioActualizado));
      
      console.log('✅ Usuario actualizado localmente:', usuarioActualizado.nombre);
      
      return usuarioActualizado;
    } catch (error) {
      console.error('❌ Error actualizando usuario local:', error);
      throw error;
    }
  };

  // ✅ NUEVA FUNCIÓN: Actualizar campos específicos del usuario
  const actualizarCamposUsuario = async (campos: Partial<Usuario>) => {
    try {
      if (!usuario) {
        console.warn('⚠️ No hay usuario para actualizar');
        return null;
      }
      
      console.log('🔄 Actualizando campos del usuario:', Object.keys(campos));
      
      const usuarioActualizado = await actualizarUsuarioLocal(campos);
      return usuarioActualizado;
    } catch (error) {
      console.error('❌ Error actualizando campos:', error);
      return null;
    }
  };

  return {
    usuario,
    esInvitado,
    loading,
    logout,
    refetch: cargarAuthState,
    actualizarUsuarioLocal, // ✅ Exportar la nueva función
    actualizarCamposUsuario // ✅ Opcional: función más específica
  };
};