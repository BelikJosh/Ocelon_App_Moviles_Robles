// utils/TimerStore.ts
type TimerData = {
  active: boolean;
  seconds: number;
  cost: number;
  phase: 'COUNTDOWN' | 'STOPWATCH';
  countdown: number;
  rawQrData: string;
  startTime: number | null; // ← AGREGAR para calcular tiempo transcurrido
};

const TimerStore: TimerData = {
  active: false,
  seconds: 0,
  cost: 0,
  phase: 'COUNTDOWN',
  countdown: 10,
  rawQrData: '',
  startTime: null, // ← AGREGAR
};

const listeners: Function[] = [];
let countdownInterval: NodeJS.Timeout | null = null;
let timerInterval: NodeJS.Timeout | null = null;

// Función para calcular el tiempo transcurrido desde el inicio
const getElapsedSeconds = () => {
  if (!TimerStore.startTime) return TimerStore.seconds;
  const now = Date.now();
  return Math.floor((now - TimerStore.startTime) / 1000);
};

// Función para calcular el costo basado en el tiempo
const calculateCost = (seconds: number) => {
  // $15 MXN por cada 10 segundos, empezando después del countdown
  const chargingSeconds = Math.max(0, seconds - 10); // Restar los 10 segundos gratis
  return Math.floor(chargingSeconds / 10) * 15;
};

export const updateTimer = (data: Partial<TimerData>) => {
  Object.assign(TimerStore, data);
  listeners.forEach((l) => l());
};

export const getTimer = () => ({ 
  ...TimerStore,
  seconds: TimerStore.active ? getElapsedSeconds() : TimerStore.seconds,
  cost: TimerStore.active ? calculateCost(getElapsedSeconds()) : TimerStore.cost
});

export const onTimerChange = (listener: Function) => {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
};

export const startTimer = (qrData: string) => {
  // Limpiar timers anteriores
  if (countdownInterval) clearInterval(countdownInterval);
  if (timerInterval) clearInterval(timerInterval);
  
  const startTime = Date.now();
  
  TimerStore.active = true;
  TimerStore.phase = 'COUNTDOWN';
  TimerStore.countdown = 10;
  TimerStore.seconds = 0;
  TimerStore.cost = 0;
  TimerStore.rawQrData = qrData;
  TimerStore.startTime = startTime;
  
  // Iniciar countdown
  countdownInterval = setInterval(() => {
    const elapsed = getElapsedSeconds();
    const remainingCountdown = Math.max(0, 10 - elapsed);
    
    if (remainingCountdown <= 0) {
      if (countdownInterval) clearInterval(countdownInterval);
      TimerStore.phase = 'STOPWATCH';
      TimerStore.countdown = 0;
      listeners.forEach((l) => l());
    } else {
      TimerStore.countdown = remainingCountdown;
      listeners.forEach((l) => l());
    }
  }, 100);
  
  // Timer para actualizaciones continuas (más frecuente para mejor UX)
  timerInterval = setInterval(() => {
    if (TimerStore.active) {
      listeners.forEach((l) => l());
    }
  }, 500);
  
  listeners.forEach((l) => l());
};

export const stopTimer = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Guardar el estado final antes de resetear
  const finalSeconds = getElapsedSeconds();
  const finalCost = calculateCost(finalSeconds);
  
  TimerStore.active = false;
  TimerStore.seconds = finalSeconds;
  TimerStore.cost = finalCost;
  TimerStore.phase = 'COUNTDOWN';
  TimerStore.countdown = 10;
  TimerStore.startTime = null;
  
  listeners.forEach((l) => l());
};

// Función para pausar el timer (si la necesitas)
export const pauseTimer = () => {
  if (countdownInterval) clearInterval(countdownInterval);
  if (timerInterval) clearInterval(timerInterval);
  countdownInterval = null;
  timerInterval = null;
};

// Función para reanudar el timer (si la necesitas)
export const resumeTimer = () => {
  if (!TimerStore.active || !TimerStore.startTime) return;
  
  // Recalcular el tiempo transcurrido
  const elapsed = getElapsedSeconds();
  
  if (TimerStore.phase === 'COUNTDOWN') {
    const remainingCountdown = Math.max(0, 10 - elapsed);
    if (remainingCountdown > 0) {
      countdownInterval = setInterval(() => {
        const currentElapsed = getElapsedSeconds();
        const currentRemaining = Math.max(0, 10 - currentElapsed);
        
        if (currentRemaining <= 0) {
          if (countdownInterval) clearInterval(countdownInterval);
          TimerStore.phase = 'STOPWATCH';
          TimerStore.countdown = 0;
          listeners.forEach((l) => l());
        } else {
          TimerStore.countdown = currentRemaining;
          listeners.forEach((l) => l());
        }
      }, 100);
    } else {
      TimerStore.phase = 'STOPWATCH';
      TimerStore.countdown = 0;
    }
  }
  
  // Timer para actualizaciones continuas
  timerInterval = setInterval(() => {
    if (TimerStore.active) {
      listeners.forEach((l) => l());
    }
  }, 500);
  
  listeners.forEach((l) => l());
};