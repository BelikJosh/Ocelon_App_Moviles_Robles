// utils/TimerStore.ts
// Store global para el timer de estacionamiento - COSTO EN USD

// ═══════════════════════════════════════════════════════════════
// Configuración de Tarifas
// ═══════════════════════════════════════════════════════════════

// Tarifa: $1.00 USD por cada 10 segundos (para demo)
const RATE_USD = 1.00;           // USD por intervalo
const INTERVAL_SECONDS = 10;      // Cada cuántos segundos se cobra
const FREE_TIME_SECONDS = 5;      // Tiempo libre inicial

// ═══════════════════════════════════════════════════════════════

type Phase = 'COUNTDOWN' | 'BILLING';

interface TimerState {
  active: boolean;
  seconds: number;        // Segundos transcurridos en billing
  cost: number;          // Costo en USD
  rawQrData: string;
  phase: Phase;
  countdown: string;      // "5", "4", "3"... para mostrar
  startTime: number | null;
}

// Estado inicial
const initialState: TimerState = {
  active: false,
  seconds: 0,
  cost: 0,
  rawQrData: '',
  phase: 'COUNTDOWN',
  countdown: FREE_TIME_SECONDS.toString(),
  startTime: null,
};

// Estado actual
let state: TimerState = { ...initialState };

// Listeners para notificar cambios
const listeners: Set<() => void> = new Set();

// Intervalo del timer
let timerInterval: ReturnType<typeof setInterval> | null = null;

// Variables de control interno
let countdownValue = FREE_TIME_SECONDS;

// ═══════════════════════════════════════════════════════════════
// Funciones públicas
// ═══════════════════════════════════════════════════════════════

/**
 * Obtener el estado actual del timer
 */
export function getTimer(): TimerState {
  return { ...state };
}

/**
 * Suscribirse a cambios del timer
 * @returns Función para desuscribirse
 */
export function onTimerChange(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Iniciar el timer de estacionamiento
 * @param rawQrData - Datos del QR escaneado
 */
export function startTimer(rawQrData: string): void {
  // Si ya está activo, no hacer nada
  if (state.active) {
    console.log('⚠️ [TimerStore] Timer ya está activo');
    return;
  }

  console.log('🚀 [TimerStore] Iniciando timer...');
  console.log('   QR Data:', rawQrData.slice(0, 50) + '...');

  // Reset state
  countdownValue = FREE_TIME_SECONDS;

  state = {
    active: true,
    seconds: 0,
    cost: 0,
    rawQrData,
    phase: 'COUNTDOWN',
    countdown: countdownValue.toString(),
    startTime: Date.now(),
  };

  notifyListeners();

  // Iniciar intervalo (cada segundo)
  timerInterval = setInterval(() => {
    tick();
  }, 1000);
}

/**
 * Detener el timer
 */
export function stopTimer(): void {
  console.log('🛑 [TimerStore] Deteniendo timer...');
  console.log('   Tiempo total:', state.seconds, 'segundos');
  console.log('   Costo final: $' + state.cost.toFixed(2), 'USD');

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  state = { ...initialState };
  countdownValue = FREE_TIME_SECONDS;

  notifyListeners();
}

/**
 * Actualizar datos del QR (si es necesario)
 */
export function updateQrData(rawQrData: string): void {
  state = { ...state, rawQrData };
  notifyListeners();
}

/**
 * Obtener el costo formateado en USD
 */
export function getFormattedCost(): string {
  return `$${state.cost.toFixed(2)} USD`;
}

/**
 * Obtener el tiempo formateado HH:MM:SS
 */
export function getFormattedTime(): string {
  const totalSeconds = state.seconds;
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

// ═══════════════════════════════════════════════════════════════
// Funciones internas
// ═══════════════════════════════════════════════════════════════

/**
 * Tick del timer (cada segundo)
 */
function tick(): void {
  if (!state.active) return;

  if (state.phase === 'COUNTDOWN') {
    // Fase de cuenta regresiva (tiempo libre)
    countdownValue--;

    if (countdownValue <= 0) {
      // Termina el tiempo libre, comienza el cobro
      console.log('⏱️ [TimerStore] Tiempo libre terminado, iniciando cobro...');
      state = {
        ...state,
        phase: 'BILLING',
        countdown: '0',
        seconds: 0,
        cost: 0,
      };
    } else {
      state = {
        ...state,
        countdown: countdownValue.toString(),
      };
    }
  } else {
    // Fase de cobro
    const newSeconds = state.seconds + 1;

    // Calcular costo: $1 USD por cada 10 segundos
    const intervals = Math.floor(newSeconds / INTERVAL_SECONDS);
    const newCost = intervals * RATE_USD;

    state = {
      ...state,
      seconds: newSeconds,
      cost: newCost,
    };

    // Log cada 10 segundos
    if (newSeconds % INTERVAL_SECONDS === 0) {
      console.log(`💰 [TimerStore] ${newSeconds}s - $${newCost.toFixed(2)} USD`);
    }
  }

  notifyListeners();
}

/**
 * Notificar a todos los listeners
 */
function notifyListeners(): void {
  listeners.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('Error en listener del TimerStore:', error);
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// Exportar configuración (para mostrar en UI)
// ═══════════════════════════════════════════════════════════════

export const TIMER_CONFIG = {
  RATE_USD,
  INTERVAL_SECONDS,
  FREE_TIME_SECONDS,
};