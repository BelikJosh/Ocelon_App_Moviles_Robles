// navigation/types/navigation.ts
import { NavigatorScreenParams } from '@react-navigation/native';

// Tipos para el payload del QR de Open Payments
export type QrPayload = {
  amount: string;
  raw: string;
  scheme: string;
  nonce: string;
  ts: string;
  from: string;
  spot: string;
  parking: string;
  elapsedTime: number;
  finalCost: number;
};

// Tipos para los métodos de pago
export type PaymentMethod = 'open_payments' | 'digital' | 'cash';

// Stack principal de navegación
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  AppTabs: NavigatorScreenParams<TabParamList> | undefined;
  CrearUsuario: undefined;
  Timer: { rawQrData?: string };
  DigitalPayment: { monto: number; rawQrData: string };
  CashPayment: { monto: number; rawQrData: string };
  ExitScreen: {
    rawQrData: string;
    referencia: string;
    monto: number;
    paymentMethod?: PaymentMethod; // Opcional: pasar directamente el método
  };
  ValorationScreen: {
    parking?: string;
    spot?: string;
    amount?: number;
    time?: string;
    paymentMethod?: PaymentMethod | string;
    paymentId?: string;
    referencia?: string; // Agregado para mostrar en el resumen
  };
};

// Tabs de la aplicación
export type TabParamList = {
  Home: undefined;
  Wallet: { qr?: QrPayload } | undefined; // Puede recibir datos del QR o ser undefined
  Scanner: undefined;
  Map: undefined;
  Config: undefined;
};