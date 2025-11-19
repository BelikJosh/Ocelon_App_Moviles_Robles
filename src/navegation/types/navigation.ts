// navigation/types/navigation.ts
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  AppTabs: undefined;
  CrearUsuario: undefined;
  Timer: { rawQrData: string }; // ← AGREGAR ESTA LÍNEA
};

export type TabParamList = {
  Home: undefined;
  Wallet: undefined;
  Scanner: undefined;
  Map: undefined;
  Config: undefined;
};