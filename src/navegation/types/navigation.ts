// navigation/types/navigation.ts
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  AppTabs: undefined;
  CrearUsuario: undefined;
  Timer: { rawQrData: string }; // ← AGREGAR ESTA LÍNEA
  DigitalPayment: { monto: number; rawQrData: string }; 
  CashPayment: { monto: number; rawQrData: string }; 
  ExitScreen: { rawQrData: string; referencia: string; monto: number };
  ValorationScreen: undefined;
};  

export type TabParamList = {
  Home: undefined;
  Wallet: undefined;
  Scanner: undefined;
  Map: undefined;
  Config: undefined;
};