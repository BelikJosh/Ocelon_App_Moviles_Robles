// shim.js
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'text-encoding-polyfill';

if (typeof BigInt === 'undefined') {
  global.BigInt = require('big-integer');
}