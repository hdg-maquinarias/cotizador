/* Permite elegir el nombre del PDF o la imagen al momento de exportar. */
(function () {
  var nombrePDFElegido = null;

  function pedirNombre(nombreActual, extension, etiqueta) {
    var sugerido = String(nombreActual || 'Cotizacion_HDG').replace(/\.[^.]+$/, '');
    var escrito = window.prompt('Nombre para guardar ' + etiqueta + ':', sugerido);
    if (escrito === null) return null;
    var limpio = escrito.trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
      .replace(/[. ]+$/, '');
    return (limpio || sugerido) + '.' + extension;
  }

  document.addEventListener('click', function (evento) {
    var boton = evento.target.closest && evento.target.closest('#btnPdf');
    if (!boton || boton.disabled) return;
    var sugerido = 'Cotizacion_HDG_' + (document.getElementById('modelo').value.trim() || 'Hanomag') + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
    nombrePDFElegido = pedirNombre(sugerido, 'pdf', 'el PDF');
    if (nombrePDFElegido === null) {
      evento.preventDefault();
      evento.stopImmediatePropagation();
    }
  }, true);

  var clickOriginal = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (/\.pdf$/i.test(this.download || '') && nombrePDFElegido) {
      this.download = nombrePDFElegido;
      nombrePDFElegido = null;
    } else if (/\.pdf$/i.test(this.download || '') || /\.jpe?g$/i.test(this.download || '')) {
      var esPDF = /\.pdf$/i.test(this.download || '');
      var elegido = pedirNombre(this.download, esPDF ? 'pdf' : 'jpg', esPDF ? 'el PDF' : 'la imagen');
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
