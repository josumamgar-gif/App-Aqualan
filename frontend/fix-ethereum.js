/**
 * Evita el error "Cannot redefine property: ethereum" causado por extensiones
 * de Chrome (wallets/crypto) que intentan inyectar window.ethereum.
 */
if (typeof window !== "undefined") {
  // 1) Suprimir el error si aun así se lanza (para que no rompa la app)
  function suppressEthereumError(e) {
    const msg = e && (e.message || e.reason || String(e));
    if (msg && msg.includes("Cannot redefine property: ethereum")) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      return true;
    }
  }
  window.addEventListener("error", suppressEthereumError, true);
  window.addEventListener("unhandledrejection", function (e) {
    if (suppressEthereumError(e)) e.preventDefault && e.preventDefault();
  }, true);
  var _onerror = window.onerror;
  window.onerror = function (msg) {
    if (typeof msg === "string" && msg.includes("Cannot redefine property: ethereum")) {
      return true;
    }
    if (_onerror) return _onerror.apply(this, arguments);
    return false;
  };

  // 2) Interceptar defineProperty para que las extensiones puedan definir ethereum
  var origDefineProperty = Object.defineProperty;
  Object.defineProperty = function (obj, prop, descriptor) {
    if (obj === window && prop === "ethereum") {
      try {
        var desc = Object.getOwnPropertyDescriptor(window, "ethereum");
        if (desc && desc.configurable) {
          delete window.ethereum;
        }
      } catch (_) {}
    }
    return origDefineProperty.call(this, obj, prop, descriptor);
  };

  // 3) Si ethereum no existe, definirlo como configurable
  try {
    if (!Object.getOwnPropertyDescriptor(window, "ethereum")) {
      origDefineProperty(window, "ethereum", {
        value: undefined,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
  } catch (_) {}
}
