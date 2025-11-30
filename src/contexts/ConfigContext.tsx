// contexts/ConfigContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type Language = 'es' | 'en';

interface ConfigContextType {
  theme: ThemeMode;
  language: Language;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Textos en diferentes idiomas
const translations = {
  es: {
    // Login Screen
    welcome: 'Bienvenido a',
    email: 'Correo electrónico',
    password: 'Contraseña',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    login: 'Iniciar sesión',
    createAccount: 'Crear cuenta',
    continueAsGuest: 'Continuar como invitado',
    loginWithGoogle: 'Iniciar sesión con Google',
    terms: 'Términos de servicio',
    privacy: 'Política de privacidad',
    or: 'o',
    biometricLogin: 'Iniciar con biometría',
    useBiometric: 'Usar biometría para próximos inicios de sesión',
    
    // Config Screen
    settings: 'Configuración',
    appearance: 'Apariencia',
    language: 'Idioma',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    auto: 'Automático',
    spanish: 'Español',
    english: 'Inglés',
    
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    continue: 'Continuar',
    error: 'Error',
    success: 'Éxito',
    loading: 'Cargando...',
    hello: 'Hola',
    guest: 'Invitado',
    premiumUser: 'Usuario Premium',
    guestMode: 'Modo Invitado',
    notAuthenticated: 'No autenticado',
    support: 'Soporte',
    home: 'Inicio',
    wallet: 'Wallet',
    map: 'Mapa',
      configureSpot: 'Configurar Cajón',
    qrForParking: 'QR para iniciar estacionamiento',
    howItWorks: '¿Cómo funciona?',
    howItWorksDescription: '1. El usuario escanea este QR al entrar al estacionamiento\n2. Se inicia el contador de tiempo automáticamente\n3. Al salir, paga en USD y se convierte a MXN\n4. Tarifa: $1.00 USD por cada 10 segundos (demo)',
    destinationWallet: 'Wallet destino (recibe MXN)',
    parkingSpot: 'Cajón / Zona',
    sessionId: 'ID de Sesión (Nonce)',
    rateDemo: 'Tarifa (Demo)',
    rateDescription: '$1.00 USD por cada 10 segundos',
    paymentConversion: 'El usuario paga en USD → Se convierte a MXN',
    regenerateSpot: 'Regenerar Cajón y Nonce',
    spot: 'Cajón',
    deepLink: 'Deep link',
    share: 'Compartir',
    test: 'Probar',
    publishQR: 'Publicar QR en la nube',
    qrPublished: 'QR de estacionamiento publicado en la nube.',
    qrSaveError: 'No se pudo guardar el QR en la nube.',
    shareError: 'No se pudo compartir el enlace.',
    oops: 'Ups',
    hint1: 'Este QR NO incluye monto - se calcula según el tiempo de estacionamiento.',
    hint2: 'Al escanear, se inicia el TimerScreen que cuenta el tiempo y calcula el costo en USD.',
    hint3: 'El pago se hace desde la wallet del usuario en USD y llega a ocelon1 en MXN.',
    payParking: 'Pagar Estacionamiento',
    amountToPay: 'Monto a Pagar',
    parkingTime: 'Tiempo de estacionamiento',
    willConvertTo: 'Se convertirá a',
    rate: 'Tasa',
    from: 'Desde',
    to: 'Hacia',
    parkingDetails: 'Detalles del Estacionamiento',
    totalTime: 'Tiempo total',
    session: 'Sesión',
    timestamp: 'Timestamp',
    authorizingPayment: 'Autorizando pago...',
    processingConversion: 'Procesando conversión USD → MXN...',
    paymentCompleted: '¡Pago completado!',
    paymentError: 'Error en el pago',
    pay: 'Pagar',
    authorizePayment: 'Autorizar Pago',
    loadingAuthorization: 'Cargando autorización...',
    preparingAuthorization: 'Preparando autorización...',
    connectionError: 'Error de Conexión',
    serverConnectionError: 'No se pudo conectar al servidor',
    ensureServerRunning: 'Asegúrate de que el servidor esté ejecutándose en',
    missingPaymentData: 'Faltan datos necesarios para finalizar el pago',
    paymentFailed: 'No se pudo completar el pago. Por favor intenta nuevamente.',
    incomingPaymentError: 'No se pudo crear el incoming payment - ID no recibido en la estructura esperada',
    grantDataError: 'No se recibieron todos los datos necesarios del grant',
    paymentInitError: 'No se pudo iniciar el pago',
    paymentRequestError: 'Error creando la solicitud de pago. Intenta nuevamente.',
  welcomeTo: 'Bienvenido a',
    sloganPart1: 'Estaciona fácil',
    sloganPart2: 'paga rápido',
    sloganPart3: 'vive mejor',
    spanishSlogan: 'Estaciona fácil, paga rápido, vive mejor',
    feature1Title: 'Entrada ágil',
    feature1Text: 'Genera tu QR en segundos para acceder sin filas.',
    feature2Title: 'Pago con QR',
    feature2Text: 'Compatible con Open Payments. Simple y directo.',
    feature3Title: 'Ubica tu sitio',
    feature3Text: 'Consulta mapa y zonas disponibles al instante.',
    logout: 'Cerrar Sesión',
    allRightsReserved: 'Todos los derechos reservados.',
    thanksForUsing: '¡Gracias por usar Ocelon!',
    seeYouSoon: 'Esperamos verte pronto de nuevo. ¡Buen viaje!',

    exit: 'Salir',

    haveProblem: '¿Tienes un problema?',
    haveComplaint: '¿Tienes alguna queja?',
    contactUsPhone: 'Contáctanos al número +524497510854',
    contactUsEmail: 'Contáctanos al correo electrónico',
    contactUsWhatsApp: 'Escríbenos por WhatsApp',
    supportSchedule: 'Nuestro equipo de soporte está disponible de lunes a viernes de 9:00 AM a 6:00 PM',
    
    enterEmail: 'Ingresa tu correo electrónico',
    enterPassword: 'Ingresa tu contraseña',
  
    faceRecognition: 'reconocimiento facial',
    fingerprint: 'huella digital',
    biometrics: 'biometría',
    forFutureLogins: 'para próximos inicios de sesión',
    loginWith: 'Iniciar con',

    getRedirectUri: 'Obtener Redirect URI',
    termsOfService: 'Términos de servicio',
    privacyPolicy: 'Política de privacidad',
    completeAllFields: 'Por favor completa todos los campos',
    validEmail: 'Por favor ingresa un email válido',
    user: 'Usuario',
    googleUser: 'Usuario Google',
   
    toOcelon: 'a Ocelon',

    easy: 'Fácil',
    fast: 'Rápido',
    secure: 'Seguro',
    getStarted: '¡Comenzar!',

    registerToStart: 'Regístrate para empezar a usar Ocelon',
    fullName: 'Nombre completo',
    fullNamePlaceholder: 'Nombre completo',
    emailPlaceholder: 'correo@ejemplo.com',
    phoneOptional: 'Teléfono (opcional)',
    phonePlaceholder: '10 dígitos',
    passwordPlaceholder: 'Mínimo 6 caracteres',
    confirmPassword: 'Confirmar contraseña',
    confirmPasswordPlaceholder: 'Repite tu contraseña',
    backToLogin: 'Volver al login',
    accountCreated: 'Cuenta creada correctamente en DynamoDB',
   
    passwordsDontMatch: 'Las contraseñas no coinciden',
       loadingPermissions: 'Cargando permisos...',
    noCameraAccess: 'Sin acceso a la cámara',
    cameraAccessRequired: 'Necesitamos acceso a la cámara para escanear códigos QR',
    allowCamera: 'Permitir cámara',
    scanQR: 'Escanear QR',
    qrScanned: '¡QR Escaneado!',
    redirectingToTimer: 'Redirigiendo al temporizador...',
    scanAnotherQR: 'Escanear otro QR',
    frameQRCode: 'Encuadra el código QR dentro del marco',
    scanningAutomatic: 'El escaneo es automático',
    time: 'Tiempo',
    cost: 'Costo',
    freeTimeRemaining: 'Tiempo libre restante',
    elapsedTime: 'Tiempo Transcurrido (HH:MM:SS)',
    parking: 'Estacionamiento',
    totalCost: 'Costo Total',
    every: 'cada',
    seconds: 'segundos',
    willConvertToMXN: 'Se convertirá a MXN al pagar',
    sessionDetails: 'Detalles de la Sesión',
   
    cancelDebug: 'Cancelar (Debug)',
    smartParking: 'Estacionamiento Inteligente',
paymentConfirmed: '¡Pago Confirmado!',
    showThisCode: 'Muestra este código en la salida',
    amountPaid: 'Monto pagado',
    reference: 'Referencia',
    scanAtExit: 'Escanea en la barrera de salida',
    enoughTime: '¡Tienes tiempo suficiente!',
    hurryUp: 'Apresúrate, queda poco tiempo',
    showCodeNow: '¡Muestra el código ahora!',
    timeRemaining: 'Tiempo restante',
    codeWillExpire: 'El código expirará cuando el tiempo termine',
    simulateQRScanned: 'Simular QR Escaneado',
    contactStaff: 'Si tienes problemas, contacta al personal del estacionamiento',
    ocelonParking: 'Ocelon Estacionamiento',

     thanksForUsingOcelon: '¡Gracias por usar Ocelon!',
    howWasExperience: '¿Cómo fue tu experiencia de estacionamiento?',
    sessionSummary: 'Resumen de tu Sesión',
  
    totalPaid: 'Total pagado',
    rateExperience: 'Califica tu experiencia',
    yourOpinionMatters: 'Tu opinión nos ayuda a mejorar',
    bad: 'Mala',
    excellent: 'Excelente',
    tapToRate: 'Toca para calificar',
    canImprove: 'Podemos mejorar',
    goodExperience: 'Buena experiencia',
    commentsOptional: 'Comentarios (opcional)',
    shareExperience: '¿Algo que quieras compartir sobre tu experiencia?',
    writeCommentsHere: 'Escribe tus comentarios aquí...',
    selectRating: 'Selecciona una calificación',
    submitRating: 'Enviar Valoración',
    skipAndContinue: 'Omitir y continuar',
   
    thanksForRating: '¡Gracias por tu Valoración!',
    opinionHelpsImprove: 'Tu opinión nos ayuda a mejorar el servicio para todos.',
    yourRating: 'Tu calificación',
    backToHome: 'Volver al Inicio',
    selectPaymentMethod: 'Selecciona un método de pago',
electronicPayment: 'Pago Electrónico',
electronicPaymentSubtext: 'Tarjetas, Apple Pay, PayPal',
cashPayment: 'Pago en Efectivo',
cashPaymentSubtext: 'Cajeros autorizados',
openPayments: 'Open Payments',
openPaymentsSubtext: 'Pago instantáneo',

addCard: 'Agregar Tarjeta',
cardNumber: 'Número de tarjeta',
cardNumberPlaceholder: '0000 0000 0000 0000',
cardholderName: 'Nombre del titular',
cardholderNamePlaceholder: 'COMO APARECE EN LA TARJETA',
expiryDate: 'Vencimiento (MM/AA)',
expiryPlaceholder: 'MM/AA',
cvv: 'CVV',
cvvPlaceholder: '123',
saveCard: 'Guardar Tarjeta',
securePayment: 'Pagos seguros con encriptación SSL',
cardNumberError: 'Número de tarjeta incompleto',
cvvError: 'CVV inválido',
expiryError: 'Fecha de vencimiento requerida',
cardholderError: 'Nombre del titular requerido',
genericCard: 'Genérica',
card: 'Tarjeta',
cardholder: 'Titular',
cardholderPlaceholder: 'NOMBRE APELLIDO',
expires: 'Expira',
cardDisclaimer: 'Esta tarjeta es intransferible y para uso exclusivo del titular.',

digitalPayment: 'Pago Digital',
totalToPay: 'Total a Pagar',
quickPayment: 'Pago Rápido',
myCards: 'Mis Tarjetas',
add: 'Agregar',
noCardsSaved: 'No tienes tarjetas guardadas',
credit: 'Crédito',
debit: 'Débito',
payWithCard: 'Pagar ${amount} con ${brand}',
selectCard: 'Selecciona una tarjeta',

cardAddedSuccess: '¡Tarjeta Agregada!',
cardAddedMessage: 'Tu tarjeta ${brand} •••• ${last4} ha sido agregada exitosamente.',
loginRequired: 'Debe iniciar sesión para realizar un pago digital',
selectCardRequired: 'Seleccione una tarjeta para continuar con el pago',
confirmPayment: 'Confirmar Pago',
confirmPaymentMessage: '¿Estás seguro de pagar $${amount} con tu tarjeta ${brand} •••• ${last4}?',
understood: 'Entendido',
authorizedCashier: 'Cajero Autorizado',
paymentReference: 'Referencia de pago',
qrForCashier: 'Código QR para Cajero',
showAtCashier: 'Muestra este código en el cajero autorizado',
scanAtCashier: 'Escanea en el cajero',
instructions: 'Instrucciones',
cashInstruction1: 'Dirígete a un cajero autorizado',
cashInstruction2: 'Selecciona "Pago de Servicios"',
cashInstruction3: 'Escanea este código QR',
cashInstruction4: 'Deposita el monto exacto',
cashInstruction5: 'Confirma la operación',
important: 'Importante',
cashPaymentWarning: 'El pago debe realizarse por el monto exacto. Conserva tu comprobante hasta salir del estacionamiento.',
paidAtCashier: 'He pagado en cajero',
changePaymentMethod: 'Cambiar método de pago',
adjustView: 'Ajustar vista',
permissionRequired: 'Permiso requerido',
locationPermissionRequired: 'Activa el permiso de ubicación para centrar el mapa en tu posición.',
locationError: 'No se pudo obtener tu ubicación.',
locationSaveError: 'No se pudo guardar tu ubicación.',
saved: 'Guardado',
locationSaved: 'Ubicación del auto guardada.',
done: 'Listo',
locationCleared: 'Ubicación del auto eliminada.',
parkedCar: 'Auto estacionado',
saveCarHere: 'Guardar auto aquí',
deleteSavedLocation: 'Borrar ubicación guardada',
followMyMovement: 'Seguir mi movimiento',
km: 'km',
min: 'min',
nearCar: 'Estás a ~{distance} m de tu auto',
paymentSuccess: '¡Pago Exitoso',
paymentProcessed: 'Tu pago ha sido procesado exitosamente',

goToExit: 'Dirígete a la salida y muestra el código QR',
continueToExit: 'Continuar a la Salida',
transactionId: 'ID de transacción',

  },
  en: {
    // Login Screen
    welcome: 'Welcome to',
    email: 'Email',
    password: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    login: 'Log in',
    createAccount: 'Create account',
    continueAsGuest: 'Continue as guest',
    loginWithGoogle: 'Sign in with Google',
    terms: 'Terms of service',
    privacy: 'Privacy policy',
    or: 'or',
    biometricLogin: 'Sign in with biometrics',
    useBiometric: 'Use biometrics for future logins',
    
    // Config Screen
    settings: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    spanish: 'Spanish',
    english: 'English',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    continue: 'Continue',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
     hello: 'Hello',
    guest: 'Guest',
    premiumUser: 'Premium User',
    guestMode: 'Guest Mode',
    notAuthenticated: 'Not authenticated',
    support: 'Support',
    home: 'Home',
    wallet: 'Wallet',
    map: 'Map',
     configureSpot: 'Configure Spot',
    qrForParking: 'QR to start parking',
    howItWorks: 'How it works?',
    howItWorksDescription: '1. User scans this QR when entering the parking lot\n2. The time counter starts automatically\n3. When leaving, pays in USD and converts to MXN\n4. Rate: $1.00 USD every 10 seconds (demo)',
    destinationWallet: 'Destination wallet (receives MXN)',
    parkingSpot: 'Spot / Zone',
    sessionId: 'Session ID (Nonce)',
    rateDemo: 'Rate (Demo)',
    rateDescription: '$1.00 USD every 10 seconds',
    paymentConversion: 'User pays in USD → Converted to MXN',
    regenerateSpot: 'Regenerate Spot and Nonce',
    spot: 'Spot',
    deepLink: 'Deep link',
    share: 'Share',
    test: 'Test',
    publishQR: 'Publish QR to cloud',
    qrPublished: 'Parking QR published to cloud.',
    qrSaveError: 'Could not save QR to cloud.',
    shareError: 'Could not share link.',
    oops: 'Oops',
    hint1: 'This QR does NOT include amount - it is calculated based on parking time.',
    hint2: 'When scanned, the TimerScreen starts which counts time and calculates cost in USD.',
    hint3: 'Payment is made from user wallet in USD and arrives at ocelon1 in MXN.',
    payParking: 'Pay Parking',
    amountToPay: 'Amount to Pay',
    parkingTime: 'Parking time',
    willConvertTo: 'Will convert to',
    rate: 'Rate',
    from: 'From',
    to: 'To',
    parkingDetails: 'Parking Details',
    totalTime: 'Total time',
    session: 'Session',
    timestamp: 'Timestamp',
    authorizingPayment: 'Authorizing payment...',
    processingConversion: 'Processing conversion USD → MXN...',
    paymentCompleted: 'Payment completed!',
    paymentError: 'Payment error',
    pay: 'Pay',
    authorizePayment: 'Authorize Payment',
    loadingAuthorization: 'Loading authorization...',
    preparingAuthorization: 'Preparing authorization...',
    connectionError: 'Connection Error',
    serverConnectionError: 'Could not connect to server',
    ensureServerRunning: 'Ensure the server is running at',
    missingPaymentData: 'Missing required data to complete payment',
    paymentFailed: 'Could not complete payment. Please try again.',
    incomingPaymentError: 'Could not create incoming payment - ID not received in expected structure',
    grantDataError: 'Not all required grant data received',
    paymentInitError: 'Could not initiate payment',
    paymentRequestError: 'Error creating payment request. Try again.',
     welcomeTo: 'Welcome to',
    sloganPart1: 'Park with ease',
    sloganPart2: 'pay with speed',
    sloganPart3: 'live a better life',
    spanishSlogan: 'Park with ease, pay with speed, live a better life',
    feature1Title: 'Quick Entry',
    feature1Text: 'Generate your QR in seconds for queue-free access.',
    feature2Title: 'QR Payment',
    feature2Text: 'Compatible with Open Payments. Simple and direct.',
    feature3Title: 'Find Your Spot',
    feature3Text: 'Check map and available zones instantly.',
    logout: 'Log Out',
    allRightsReserved: 'All rights reserved.',
    thanksForUsing: 'Thanks for using Ocelon!',
    seeYouSoon: 'We hope to see you again soon. Safe travels!',
    exit: 'Exit',

    haveProblem: 'Do you have a problem?',
    haveComplaint: 'Do you have a complaint?',
    contactUsPhone: 'Contact us at +524497510854',
    contactUsEmail: 'Contact us by email',
    contactUsWhatsApp: 'Write to us on WhatsApp',
    supportSchedule: 'Our support team is available Monday to Friday from 9:00 AM to 6:00 PM',
   
    enterEmail: 'Enter your email',
    enterPassword: 'Enter your password',
    
    faceRecognition: 'face recognition',
    fingerprint: 'fingerprint',
    biometrics: 'biometrics',
    forFutureLogins: 'for future logins',
    loginWith: 'Sign in with',
    
    getRedirectUri: 'Get Redirect URI',
    termsOfService: 'Terms of service',
    privacyPolicy: 'Privacy policy',
    completeAllFields: 'Please complete all fields',
    validEmail: 'Please enter a valid email',
    user: 'User',
    googleUser: 'Google User',
    
    toOcelon: 'to Ocelon',

    easy: 'Easy',
    fast: 'Fast',
    secure: 'Secure',
    getStarted: 'Get Started!',
    registerToStart: 'Register to start using Ocelon',
    fullName: 'Full name',
    fullNamePlaceholder: 'Full name',
    emailPlaceholder: 'email@example.com',
    phoneOptional: 'Phone (optional)',
    phonePlaceholder: '10 digits',
    passwordPlaceholder: 'Minimum 6 characters',
    confirmPassword: 'Confirm password',
    confirmPasswordPlaceholder: 'Repeat your password',
    backToLogin: 'Back to login',
    accountCreated: 'Account created successfully in DynamoDB',
   
    passwordsDontMatch: 'Passwords do not match',
    loadingPermissions: 'Loading permissions...',
    noCameraAccess: 'No camera access',
    cameraAccessRequired: 'We need camera access to scan QR codes',
    allowCamera: 'Allow camera',
    scanQR: 'Scan QR',
    qrScanned: 'QR Scanned!',
    redirectingToTimer: 'Redirecting to timer...',
    scanAnotherQR: 'Scan another QR',
    frameQRCode: 'Frame the QR code within the frame',
    scanningAutomatic: 'Scanning is automatic',

  
    time: 'Time',
    cost: 'Cost',
    freeTimeRemaining: 'Free time remaining',
    elapsedTime: 'Elapsed Time (HH:MM:SS)',
    parking: 'Parking',

    totalCost: 'Total Cost',
    every: 'every',
    seconds: 'seconds',
    willConvertToMXN: 'Will convert to MXN when paying',
    sessionDetails: 'Session Details',
   
    cancelDebug: 'Cancel (Debug)',
    smartParking: 'Smart Parking',

paymentConfirmed: 'Payment Confirmed!',
    showThisCode: 'Show this code at the exit',
    amountPaid: 'Amount paid',
    reference: 'Reference',
    scanAtExit: 'Scan at exit barrier',
    enoughTime: 'You have enough time!',
    hurryUp: 'Hurry up, time is running out',
    showCodeNow: 'Show the code now!',
    timeRemaining: 'Time remaining',

    codeWillExpire: 'The code will expire when time runs out',
    simulateQRScanned: 'Simulate QR Scanned',
    contactStaff: 'If you have problems, contact parking staff',

    ocelonParking: 'Ocelon Parking',


    thanksForUsingOcelon: 'Thanks for using Ocelon!',
    howWasExperience: 'How was your parking experience?',
    sessionSummary: 'Session Summary',
   
    totalPaid: 'Total paid',
    rateExperience: 'Rate your experience',
    yourOpinionMatters: 'Your opinion helps us improve',
    bad: 'Bad',
    excellent: 'Excellent',
    tapToRate: 'Tap to rate',
    canImprove: 'We can improve',
    goodExperience: 'Good experience',
    commentsOptional: 'Comments (optional)',
    shareExperience: 'Anything you want to share about your experience?',
    writeCommentsHere: 'Write your comments here...',
    selectRating: 'Select a rating',
    submitRating: 'Submit Rating',
    skipAndContinue: 'Skip and continue',
  
    thanksForRating: 'Thanks for your Rating!',
    opinionHelpsImprove: 'Your opinion helps us improve the service for everyone.',
    yourRating: 'Your rating',
    backToHome: 'Back to Home',
selectPaymentMethod: 'Select a payment method',
electronicPayment: 'Electronic Payment',
electronicPaymentSubtext: 'Cards, Apple Pay, PayPal',
cashPayment: 'Cash Payment',
cashPaymentSubtext: 'Authorized cashiers',
openPayments: 'Open Payments',
openPaymentsSubtext: 'Instant payment',
addCard: 'Add Card',
cardNumber: 'Card number',
cardNumberPlaceholder: '0000 0000 0000 0000',
cardholderName: 'Cardholder name',
cardholderNamePlaceholder: 'AS SHOWN ON CARD',
expiryDate: 'Expiry date (MM/YY)',
expiryPlaceholder: 'MM/YY',
cvv: 'CVV',
cvvPlaceholder: '123',
saveCard: 'Save Card',
securePayment: 'Secure payments with SSL encryption',
cardNumberError: 'Incomplete card number',
cvvError: 'Invalid CVV',
expiryError: 'Expiry date required',
cardholderError: 'Cardholder name required',
genericCard: 'Generic',
card: 'Card',
cardholder: 'Cardholder',
cardholderPlaceholder: 'NAME SURNAME',
expires: 'Expires',
cardDisclaimer: 'This card is non-transferable and for exclusive use by the cardholder.',

digitalPayment: 'Digital Payment',
totalToPay: 'Total to Pay',
quickPayment: 'Quick Payment',
myCards: 'My Cards',
add: 'Add',
noCardsSaved: 'No cards saved',
credit: 'Credit',
debit: 'Debit',
payWithCard: 'Pay ${amount} with ${brand}',
selectCard: 'Select a card',

cardAddedSuccess: 'Card Added!',
cardAddedMessage: 'Your ${brand} card •••• ${last4} has been successfully added.',
loginRequired: 'You must log in to make a digital payment',
selectCardRequired: 'Select a card to continue with payment',
confirmPayment: 'Confirm Payment',
confirmPaymentMessage: 'Are you sure you want to pay $${amount} with your ${brand} card •••• ${last4}?',
understood: 'Understood',
authorizedCashier: 'Authorized Cashier',
paymentReference: 'Payment reference',
qrForCashier: 'QR Code for Cashier',
showAtCashier: 'Show this code at the authorized cashier',
scanAtCashier: 'Scan at cashier',
instructions: 'Instructions',
cashInstruction1: 'Go to an authorized cashier',
cashInstruction2: 'Select "Service Payment"',
cashInstruction3: 'Scan this QR code',
cashInstruction4: 'Deposit the exact amount',
cashInstruction5: 'Confirm the operation',
important: 'Important',
cashPaymentWarning: 'Payment must be made for the exact amount. Keep your receipt until you leave the parking lot.',
paidAtCashier: 'I paid at cashier',
changePaymentMethod: 'Change payment method',

adjustView: 'Adjust View',
permissionRequired: 'Permission Required',
locationPermissionRequired: 'Enable location permission to center the map on your position.',
locationError: 'Could not get your location.',
locationSaveError: 'Could not save your location.',
saved: 'Saved',
locationSaved: 'Car location saved.',
done: 'Done',
locationCleared: 'Car location deleted.',
parkedCar: 'Parked Car',
saveCarHere: 'Save car here',
deleteSavedLocation: 'Delete saved location',
followMyMovement: 'Follow my movement',
km: 'km',
min: 'min',
nearCar: 'You are ~{distance} m from your car',

paymentSuccess: 'Payment Successful',
paymentProcessed: 'Your payment has been processed successfully',

goToExit: 'Go to the exit and show the QR code',
continueToExit: 'Continue to Exit',
transactionId: 'Transaction ID',
  }
  
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeMode>('auto');
  const [language, setLanguage] = useState<Language>('es');

  // Calcular si estamos en modo oscuro
  const isDark = theme === 'auto' ? systemColorScheme === 'dark' : theme === 'dark';

  // Cargar configuración guardada
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      const savedLanguage = await AsyncStorage.getItem('app_language');
      
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setTheme(savedTheme as ThemeMode);
      }
      
      if (savedLanguage && ['es', 'en'].includes(savedLanguage)) {
        setLanguage(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveTheme = async (newTheme: ThemeMode) => {
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const saveLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem('app_language', newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const toggleTheme = () => {
    const themes: ThemeMode[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    saveTheme(nextTheme);
  };

  const toggleLanguage = () => {
    const nextLanguage = language === 'es' ? 'en' : 'es';
    saveLanguage(nextLanguage);
  };

  // Función de traducción
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[Language]] || key;
  };

  return (
    <ConfigContext.Provider
      value={{
        theme,
        language,
        isDark,
        setTheme: saveTheme,
        setLanguage: saveLanguage,
        toggleTheme,
        toggleLanguage,
        t
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};