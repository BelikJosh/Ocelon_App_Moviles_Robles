import AWS from 'aws-sdk';

// Configurar AWS con las credenciales CORRECTAS
const config = {
  region: 'us-east-1',
  accessKeyId: 'AKIAQ5BAACIVSK6Z5XG3', // ← Tu access key
  secretAccessKey: '2cpPHlpQxElx6s5rB/qxpFuexnq39LiU+X7fA11K', // ← Tu secret key
  correctClockSkew: true,
};


AWS.config.update(config);

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  correctClockSkew: true,
  httpOptions: {
    timeout: 30000,
    connectTimeout: 5000
  }
});

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  wallet: string;
  fechaRegistro: string;
  ultimaActualizacion: string;
  estancias: any[];
  QR?: string; // ← NUEVO

}

export class DynamoDBService {
  // 🔐 MÉTODO PRINCIPAL para buscar usuario
  static async obtenerUsuarioPorEmail(email: string): Promise<Usuario | null> {
    return new Promise((resolve, reject) => {
      // PRIMERO intentar con QUERY (más eficiente)
      const queryParams = {
        TableName: 'Usuarios',
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email.toLowerCase().trim()
        }
      };

      console.log('🔍 Buscando usuario con query:', email);

      dynamoDB.query(queryParams, (err, data) => {
        if (err) {
          console.log('⚠️ Query falló, intentando con scan...', err.code);

          // Si query falla, intentar con SCAN
          const scanParams = {
            TableName: 'Usuarios',
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: {
              ':email': email.toLowerCase().trim()
            }
          };

          dynamoDB.scan(scanParams, (scanErr, scanData) => {
            if (scanErr) {
              console.error('❌ Error en scan también:', scanErr);
              reject(scanErr);
            } else {
              console.log('📊 Resultados de scan:', scanData.Items?.length);
              resolve(scanData.Items?.[0] as Usuario || null);
            }
          });
        } else {
          console.log('📊 Resultados de query:', data.Items?.length);
          resolve(data.Items?.[0] as Usuario || null);
        }
      });
    });
  }

  static async verificarCredenciales(email: string, password: string): Promise<{
    success: boolean;
    usuario?: Usuario;
    error?: string
  }> {
    try {
      console.log('🔐 Verificando credenciales...');

      // 1. PRIMERO intentar con DynamoDB (si las credenciales son buenas)
      try {
        console.log('🔄 Intentando con DynamoDB...');
        const usuario = await this.obtenerUsuarioPorEmail(email);

        if (usuario) {
          if (usuario.password === password) {
            console.log('✅ Login exitoso con DynamoDB');
            return { success: true, usuario };
          } else {
            return { success: false, error: 'Contraseña incorrecta' };
          }
        }
      } catch (dbError: any) {
        console.log('⚠️ DynamoDB falló, usando modo prueba...', dbError.code);
      }

      // 2. SI DynamoDB FALLA, usar modo prueba
      console.log('🔧 Usando modo prueba...');

      const usuariosValidos = {
        'test@test.com': 'test123',
        'admin@ocelon.com': 'admin123',
        'usuario@ejemplo.com': 'password123',
        'josue@ocelon.com': 'josue123',
        'qr@ocelon.com': 'qr123',
        'invitado@ocelon.com': 'invitado123'
      };

      if (usuariosValidos[email] && usuariosValidos[email] === password) {
        console.log('✅ Login exitoso (modo prueba)');
        return {
          success: true,
          usuario: {
            id: `USER#${email.replace(/[@.]/g, '_')}_${Date.now()}`,
            nombre: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
            email: email,
            password: password,
            wallet: `wallet_${Date.now()}`,
            fechaRegistro: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString(),
            estancias: []
          }
        };
      }

      return {
        success: false,
        error: 'Credenciales incorrectas. Usa: test@test.com / test123'
      };

    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      return {
        success: false,
        error: 'Error del servidor. Intenta más tarde.'
      };
    }
  }
  // 📝 MÉTODO PARA CREAR USUARIO
  static async crearUsuario(usuarioData: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
  }): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      try {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const userId = `USER#${timestamp}_${random}`;

        const wallet = `wallet_${timestamp}_${random}`;

        const usuarioCompleto: Usuario = {
          id: userId,
          nombre: usuarioData.nombre,
          email: usuarioData.email,
          password: usuarioData.password,
          telefono: usuarioData.telefono,
          wallet: wallet,
          fechaRegistro: new Date().toISOString(),
          ultimaActualizacion: new Date().toISOString(),
          estancias: []
        };

        const params = {
          TableName: 'Usuarios',
          Item: usuarioCompleto
        };

        console.log('📦 Insertando usuario...');

        dynamoDB.put(params, (err, data) => {
          if (err) {
            console.error('❌ Error al crear usuario:', err);
            reject(new Error(`Error: ${err.message}`));
          } else {
            console.log('✅ Usuario creado exitosamente');
            resolve(usuarioCompleto);
          }
        });

      } catch (error) {
        console.error('❌ Error inesperado:', error);
        reject(error);
      }
    });
  }
  // Agrega esta función para diagnosticar
  static async diagnosticarPermisos(): Promise<void> {
    console.log('🔍 Iniciando diagnóstico de permisos...');

    // Test 1: Permisos de escritura (put)
    try {
      const testPut = await this.crearUsuario({
        nombre: 'Test Diagnóstico',
        email: `test${Date.now()}@diagnostico.com`,
        password: 'test123',
        telefono: '1234567890'
      });
      console.log('✅ Permisos de ESCRITURA (put) - OK');
    } catch (error) {
      console.error('❌ Permisos de ESCRITURA (put) - FALLIDO:', error.message);
    }

    // Test 2: Permisos de lectura (scan)
    try {
      const testScan = await new Promise((resolve) => {
        dynamoDB.scan({ TableName: 'Usuarios', Limit: 1 }, (err, data) => {
          if (err) {
            console.error('❌ Permisos de LECTURA (scan) - FALLIDO:', err.message);
          } else {
            console.log('✅ Permisos de LECTURA (scan) - OK');
          }
          resolve(null);
        });
      });
    } catch (error) {
      console.error('❌ Error en test scan:', error);
    }

    // Test 3: Permisos de query
    try {
      const testQuery = await new Promise((resolve) => {
        const params = {
          TableName: 'Usuarios',
          IndexName: 'EmailIndex',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: { ':email': 'test@test.com' },
          Limit: 1
        };

        dynamoDB.query(params, (err, data) => {
          if (err) {
            console.error('❌ Permisos de QUERY - FALLIDO:', err.message);
            console.error('Código de error:', err.code);
          } else {
            console.log('✅ Permisos de QUERY - OK');
          }
          resolve(null);
        });
      });
    } catch (error) {
      console.error('❌ Error en test query:', error);
    }
  }
  // 🔍 MÉTODO PARA VERIFICAR PERMISOS
  static async verificarPermisos(): Promise<void> {
    return new Promise((resolve) => {
      const params = {
        TableName: 'Usuarios',
        Limit: 1
      };

      dynamoDB.scan(params, (err, data) => {
        if (err) {
          console.error('❌ Error de permisos:', {
            code: err.code,
            message: err.message
          });
        } else {
          console.log('✅ Permisos OK - Puede leer de DynamoDB');
        }
        resolve();
      });
    });
  }

  static async actualizarQRUsuario(userId: string, qr: string): Promise<void> {
    const now = new Date().toISOString();
    const params: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: 'Usuarios',
      Key: { id: userId },
      UpdateExpression: 'SET #QR = :qr, #UA = :ua',
      ExpressionAttributeNames: {
        '#QR': 'QR',
        '#UA': 'ultimaActualizacion',
      },
      ExpressionAttributeValues: {
        ':qr': qr,
        ':ua': now,
      },
      ReturnValues: 'NONE',
    };

    await dynamoDB.update(params).promise();
  }

  /** (Opcional) Actualiza campos arbitrarios por ID */
  static async actualizarCamposUsuario(
    userId: string,
    fields: Partial<Pick<Usuario, 'QR' | 'telefono' | 'nombre' | 'password' | 'wallet'>>
  ): Promise<void> {
    const now = new Date().toISOString();

    const names: Record<string, string> = { '#UA': 'ultimaActualizacion' };
    const vals: Record<string, any> = { ':ua': now };
    const sets: string[] = ['#UA = :ua'];

    Object.entries(fields).forEach(([k, v], i) => {
      const nameKey = `#F${i}`;
      const valKey = `:v${i}`;
      names[nameKey] = k;
      vals[valKey] = v;
      sets.push(`${nameKey} = ${valKey}`);
    });

    const params: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: 'Usuarios',
      Key: { id: userId },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: vals,
      ReturnValues: 'NONE',
    };

    await dynamoDB.update(params).promise();
  }
}