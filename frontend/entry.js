/**
 * Punto de entrada que ejecuta el parche de ethereum antes que el resto de la app,
 * para evitar "Cannot redefine property: ethereum" con extensiones de Chrome.
 */
require("./fix-ethereum.js");
require("expo-router/entry");
