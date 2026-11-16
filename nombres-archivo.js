/* Permite elegir el nombre del PDF o la imagen al momento de exportar. */
(function () {
  function pedirNombre(nombreActual, extension, etiqueta) {
    var sugerido = String(nombreActual || 'Cotizacion_HDG').replace(/\.[^.]+$/, '');
    var escrito = window.prompt('Nombre para guardar ' + etiqueta + ':', sugerido);
    if (escrito === null) return null;
    var limpio = escrito.trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
      .replace(/[. ]+$/, '');
    return (limpio || sugerido) + '.' + extension;
  }

  var jsPDF = window.jspdf && window.jspdf.jsPDF;
  if (jsPDF && jsPDF.prototype && typeof jsPDF.prototype.save === 'function') {
    var guardarPDF = jsPDF.prototype.save;
    jsPDF.prototype.save = function (nombre, opciones) {
      var elegido = pedirNombre(nombre, 'pdf', 'el PDF');
      if (elegido === null) return this;
      return guardarPDF.call(this, elegido, opciones);
    };
  }

  var clickOriginal = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (/\.jpe?g$/i.test(this.download || '')) {
      var elegido = pedirNombre(this.download, 'jpg', 'la imagen');
      if (elegido === null) return;
      this.download = elegido;
    }
    return clickOriginal.call(this);
  };

  if (typeof navigator.share === 'function') {
    var compartirOriginal = navigator.share.bind(navigator);
    try {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: function (datos) {
          var archivos = datos && datos.files;
          if (!archivos || !archivos.some(function (f) { return /\.jpe?g$/i.test(f.name); })) {
            return compartirOriginal(datos);
          }
          var jpg = archivos.find(function (f) { return /\.jpe?g$/i.test(f.name); });
          var elegido = pedirNombre(jpg.name, 'jpg', 'la imagen');
          if (elegido === null) return Promise.reject(new DOMException('Cancelado', 'AbortError'));
          var renombrados = archivos.map(function (f) {
            return f === jpg ? new File([f], elegido, { type: f.type, lastModified: f.lastModified }) : f;
          });
          var copia = Object.assign({}, datos, { files: renombrados });
          return compartirOriginal(copia);
        }
      });
    } catch (e) {
      // En navegadores que no permiten reemplazar navigator.share, queda disponible la descarga JPG.
    }
  }
})();
