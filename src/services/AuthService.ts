import { Auth } from 'aws-amplify';

export class AuthService {
  static async login(email: string, password: string) {
    try {
      const user = await Auth.signIn(email, password);
      return { success: true, user };
    } catch (error: any) {
      console.error('Error en login:', error);
      return { success: false, error: error.message };
    }
  }

  static async signUp(nombre: string, email: string, password: string) {
    try {
      const { user } = await Auth.signUp({
        username: email,
        password,
        attributes: {
          name: nombre,
          email: email,
        }
      });
      return { success: true, user };
    } catch (error: any) {
      console.error('Error en registro:', error);
      return { success: false, error: error.message };
    }
  }
}