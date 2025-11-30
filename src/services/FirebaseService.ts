// services/FirebaseService.ts - VERSIÓN CORREGIDA
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser'; // ✅ AÑADE ESTE IMPORT
import * as AuthSession from 'expo-auth-session'; // ✅ AÑADE ESTE IMPORT

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA3wRNAOeUuJdAEfZpZ7XfXKZMx9fY05jQ",
  authDomain: "ocelonapp.firebaseapp.com",
  projectId: "ocelonapp",
  storageBucket: "ocelonapp.firebasestorage.app",
  messagingSenderId: "361575494934",
  appId: "1:361575494934:web:949f6ddf68e366b94e4c37"
};

// Inicializar Firebase
let app;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Configurar para Expo
  WebBrowser.maybeCompleteAuthSession(); // ✅ AÑADE ESTA LÍNEA
  
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
}

export { auth };

export class FirebaseService {
  // ✅ Client ID CORRECTO - ya lo tienes!
  private static readonly GOOGLE_CLIENT_ID = '569410321728-po8nemb6b8hcbcigbp4p9nb3tc82u13g.apps.googleusercontent.com';

  // Login con Google - VERSIÓN FUNCIONAL
  static async signInWithGoogle() {
    try {
      console.log('🔐 Iniciando Google Sign-In...');
      
      // Configuración para Expo
        const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });


      console.log('📍 Redirect URI:', redirectUri);

      const authUrl = [
        `https://accounts.google.com/o/oauth2/v2/auth?`,
        `client_id=${this.GOOGLE_CLIENT_ID}`,
        `&redirect_uri=${encodeURIComponent('https://auth.expo.io/--/expo-auth-session')}`,
        `&response_type=id_token`,
        `&scope=openid%20profile%20email`,
        `&nonce=${Math.random().toString(36).substring(2, 15)}`
      ].join('');

      console.log('🔄 Abriendo navegador...');
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      console.log('📨 Resultado de autenticación:', result.type);
      
      if (result.type === 'success') {
        console.log('🔍 URL recibida:', result.url);
        
        // Procesar el resultado
        const urlParts = result.url.split('#');
        if (urlParts.length > 1) {
          const urlParams = new URLSearchParams(urlParts[1]);
          const idToken = urlParams.get('id_token');
          
          console.log('✅ Token ID recibido:', idToken ? 'SÍ' : 'NO');
          
          if (idToken) {
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            
            console.log('🎉 Google Sign-In EXITOSO!');
            console.log('👤 Usuario:', userCredential.user.email);
            
            return {
              success: true,
              user: userCredential.user
            };
          }
        }
        
        // Si no podemos extraer el token, mostramos ayuda
        Alert.alert(
          '🔍 Debug Info', 
          'Se recibió respuesta pero no se pudo extraer el token. Revisa la consola.'
        );
      }

      return {
        success: false,
        error: result.type === 'cancel' ? 'Cancelado por el usuario' : 'Error en autenticación'
      };

    } catch (error: any) {
      console.error('💥 Error en Google Sign-In:', error);
      return {
        success: false,
        error: `Error: ${error.message}`
      };
    }
  }

  // ... (los otros métodos permanecen IGUAL)
  static async signInWithEmail(email: string, password: string) {
    try {
      if (!auth) {
        throw new Error('Firebase Auth no está inicializado');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error: any) {
      console.error('Error en signInWithEmail:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'El formato del email es inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'La contraseña es incorrecta';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
          break;
        default:
          errorMessage = error.message || 'Error desconocido al iniciar sesión';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  static async createUserWithEmail(email: string, password: string) {
    try {
      if (!auth) {
        throw new Error('Firebase Auth no está inicializado');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error: any) {
      console.error('Error en createUserWithEmail:', error);
      
      let errorMessage = 'Error al crear la cuenta';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta con este email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del email es inválido';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'La creación de cuentas no está habilitada';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es demasiado débil';
          break;
        default:
          errorMessage = error.message || 'Error desconocido al crear la cuenta';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  static async signOut() {
    try {
      if (!auth) {
        throw new Error('Firebase Auth no está inicializado');
      }

      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  static getCurrentUser() {
    return auth ? auth.currentUser : null;
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    if (!auth) {
      console.error('Firebase Auth no está inicializado');
      return () => {};
    }
    
    return onAuthStateChanged(auth, callback);
  }

  static isInitialized() {
    return !!auth;
  }
}