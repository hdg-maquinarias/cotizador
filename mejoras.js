/* HDG Cotizador - mejoras: solapa "Contado especial" + salida JPG/PDF legible para celular */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var modo = 'n';

  // ---------- Estilos ----------
  var st = document.createElement('style');
  st.textContent = '.tabs{display:flex;gap:8px;margin-bottom:20px}.tab{flex:1;padding:12px;background:var(--gray-800);border:1.5px solid var(--gray-700);color:var(--gray-400);border-radius:8px;font-family:"Barlow Condensed",sans-serif;font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer}.tab.active{border-color:var(--gold);color:var(--gold)}.btn-alt{background:var(--gray-800)!important;color:var(--gold)!important;border:1.5px solid var(--gold)!important;margin-top:10px!important}';
  document.head.appendChild(st);

  // ---------- Interfaz ----------
  var main = document.querySelector('.main');
  var tabs = document.createElement('div');
  tabs.className = 'tabs';
  tabs.innerHTML = '<button class="tab active" id="tabN">Financiado</button><button class="tab" id="tabE">Contado especial</button>';
  main.insertBefore(tabs, main.firstChild);
  $('tabN').onclick = function () { setModo('n'); };
  $('tabE').onclick = function () { setModo('e'); };

  var rowN = document.querySelector('.input-row');
  var rowE = document.createElement('div');
  rowE.style.display = 'none';
  rowE.innerHTML =
    '<div class="input-row"><div class="input-group"><label class="input-label">Precio contado (USD)</label>' +
    '<input class="input-field currency" id="precioE" type="number" min="0" placeholder="0" oninput="calcular()"></div>' +
    '<div class="input-group"><label class="input-label">Descuento</label><div style="display:flex;gap:6px">' +
    '<input class="input-field currency" id="descE" type="number" min="0" placeholder="0" oninput="calcular()">' +
    '<select class="input-field" id="descTipo" style="width:84px" onchange="calcular()"><option value="p">%</option><option value="u">USD</option></select></div></div></div>' +
    '<div class="input-group"><label class="input-label">Flete (USD)</label>' +
    '<input class="input-field currency" id="fleteE" type="number" min="0" placeholder="0" oninput="calcular()">' +
    '<p class="flete-note">Uso interno &middot; Se suma al total, no figura detallado</p></div>';
  rowN.parentNode.insertBefore(rowE, rowN.nextSibling);

  var btnPdf = $('btnPdf');
  btnPdf.className = 'btn-pdf btn-alt';
  btnPdf.innerHTML = '&#11015; Generar PDF';
  btnPdf.onclick = function () { exportar('pdf'); };
  var btnJpg = document.createElement('button');
  btnJpg.className = 'btn-pdf';
  btnJpg.id = 'btnJpg';
  btnJpg.disabled = true;
  btnJpg.innerHTML = '&#128247; Enviar / guardar imagen JPG';
  btnJpg.onclick = function () { exportar('jpg'); };
  btnPdf.parentNode.insertBefore(btnJpg, btnPdf);

  function setModo(m) {
    modo = m;
    rowN.style.display = m === 'n' ? '' : 'none';
    rowE.style.display = m === 'e' ? '' : 'none';
    $('tabN').classList.toggle('active', m === 'n');
    $('tabE').classList.toggle('active', m === 'e');
    calcular();
  }

  // ---------- Cálculo ----------
  var calcOriginal = calcular;
  calcular = function () {
    if (modo === 'e') calcEsp(); else calcOriginal();
    btnJpg.disabled = btnPdf.disabled;
  };

  function calcEsp() {
    var cfg = getConfig();
    var p = parseFloat($('precioE').value) || 0;
    var ds = parseFloat($('descE').value) || 0;
    var fl = parseFloat($('fleteE').value) || 0;
    if (p <= 0) {
      $('cardsContainer').innerHTML = '';
      $('emptyState').style.display = 'block';
      btnPdf.disabled = true;
      datosCalculo = null;
      return;
    }
    $('emptyState').style.display = 'none';
    btnPdf.disabled = false;
    var desc = $('descTipo').value === 'p' ? p * ds / 100 : ds;
    if (desc > p) desc = p;
    var neto = p - desc, iva = neto * cfg.iva / 100, total = neto + iva + fl;
    datosCalculo = { esp: true, modelo: $('modelo').value.trim(), p: p, desc: desc, neto: neto, iva: iva, fl: fl, total: total, cfg: cfg };
    $('cardsContainer').innerHTML = cardHTML('Promoci\u00f3n especial contado', 'CONTADO', true, total, iva,
      [{ label: 'Precio con descuento', value: neto, detail: 'Sin IVA' }, { label: 'Descuento aplicado', value: desc, detail: 'Sobre precio de lista' }]);
  }

  // ---------- Dibujo (imagen) ----------
  async function dibujar() {
    var d = datosCalculo, W = 1080, m = 50, H = 3400;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    try { await document.fonts.load("700 40px 'Barlow Condensed'"); await document.fonts.load("400 40px 'Barlow Condensed'"); } catch (e) {}
    var F = function (w, s) { c.font = w + ' ' + s + "px 'Barlow Condensed',Arial,sans-serif"; };
    var usd = function (n) { return 'USD ' + fmt(n); };

    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#0D0D0D'; c.fillRect(0, 0, W, 230);
    c.fillStyle = '#F5C518'; c.fillRect(0, 230, W, 12);
    var tx = m;
    try {
      var im = await new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = LOGO_SRC; });
      c.drawImage(im, m, 20, 156, 190); tx = m + 190;
    } catch (e) {}
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#F5C518'; F('700', 46);
    c.fillText(d.esp ? 'PROMOCI\u00d3N ESPECIAL CONTADO' : 'COTIZACI\u00d3N HANOMAG - MICHIGAN', tx, 105, W - tx - m);
    c.fillStyle = '#B4B4B4'; F('400', 28);
    c.fillText('HORACIO D. GIRAUDO - CONCESIONARIO OFICIAL', tx, 150, W - tx - m);
    c.fillStyle = '#C8C8C8'; F('400', 26);
    c.fillText('Fecha: ' + new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }), tx, 200);

    var y = 285;
    c.fillStyle = '#F2F2EE'; c.fillRect(m, y, W - 2 * m, 100);
    c.strokeStyle = '#C8B400'; c.lineWidth = 3; c.strokeRect(m, y, W - 2 * m, 100);
    c.fillStyle = '#1E1E1E'; F('700', 46);
    c.fillText((d.modelo || 'Sin especificar').toUpperCase(), m + 24, y + 67, W - 2 * m - 48);
    y += 140;

    if (d.esp) {
      var lin = [['Precio de lista', usd(d.p)]];
      if (d.desc > 0) { lin.push(['Descuento especial', '- ' + usd(d.desc)]); lin.push(['Precio con descuento', usd(d.neto)]); }
      lin.forEach(function (l) {
        c.fillStyle = '#333'; F('600', 42); c.textAlign = 'left'; c.fillText(l[0], m + 10, y + 40);
        c.textAlign = 'right'; F('700', 42); c.fillText(l[1], W - m - 10, y + 40);
        c.strokeStyle = '#DDD'; c.lineWidth = 2; c.beginPath(); c.moveTo(m, y + 66); c.lineTo(W - m, y + 66); c.stroke();
        y += 86;
      });
      y += 20;
      c.textAlign = 'left';
      c.fillStyle = '#FFFBD7'; c.fillRect(m, y, W - 2 * m, 260);
      c.fillStyle = '#F5C518'; c.fillRect(m, y, 14, 260);
      c.fillStyle = '#7A5200'; F('700', 44); c.fillText('TOTAL CONTADO', m + 50, y + 70);
      F('400', 34); c.fillText('IVA y flete incluidos', m + 50, y + 118);
      c.fillStyle = '#1E1E1E'; F('700', 108); c.fillText(usd(d.total), m + 50, y + 218, W - 2 * m - 80);
      y += 300;
    } else {
      c.textAlign = 'left';
      c.fillStyle = '#FFFBD7'; c.fillRect(m, y, W - 2 * m, 290);
      c.fillStyle = '#F5C518'; c.fillRect(m, y, 14, 290);
      c.fillStyle = '#7A5200'; F('700', 48); c.fillText('PRECIO CONTADO', m + 50, y + 76);
      F('400', 34); c.fillText('IVA y flete incluidos', m + 50, y + 124);
      c.fillStyle = '#1E1E1E'; F('700', 124); c.fillText(usd(d.contado_total), m + 50, y + 250, W - 2 * m - 80);
      y += 330;
      c.fillStyle = '#505050'; F('700', 34); c.fillText('OPCIONES DE FINANCIACI\u00d3N', m, y + 10);
      y += 40;
      var planes = [
        ['4 CHEQUES \u00b7 45 D\u00cdAS', d.cuota1_2, '3', d.cuota_pura2, d.total2],
        ['7 CHEQUES \u00b7 90 D\u00cdAS', d.cuota1_3, '6', d.cuota_pura3, d.total3],
        ['13 CHEQUES \u00b7 180 D\u00cdAS', d.cuota1_4, '12', d.cuota_pura4, d.total4]
      ];
      planes.forEach(function (p, i) {
        var h = 256, mid = m + (W - 2 * m) / 2;
        c.fillStyle = i % 2 ? '#F3F3F3' : '#FAFAFA'; c.fillRect(m, y, W - 2 * m, h);
        c.fillStyle = '#0D0D0D'; c.fillRect(m, y, W - 2 * m, 66);
        c.fillStyle = '#F5C518'; F('700', 38); c.fillText(p[0], m + 30, y + 46);
        c.strokeStyle = '#D0D0D0'; c.lineWidth = 2; c.beginPath(); c.moveTo(mid, y + 84); c.lineTo(mid, y + 210); c.stroke();
        c.fillStyle = '#777'; F('700', 28); c.fillText('CUOTA 1', m + 30, y + 104);
        c.fillText(p[2] + ' CUOTAS DE', mid + 30, y + 104);
        c.fillStyle = '#1E1E1E'; F('700', 60);
        c.fillText(usd(p[1]), m + 30, y + 168, mid - m - 50);
        c.fillText(usd(p[3]), mid + 30, y + 168, mid - m - 50);
        c.fillStyle = '#888'; F('400', 24);
        c.fillText('incluye IVA y flete', m + 30, y + 202);
        c.fillText('sin IVA ni flete', mid + 30, y + 202);
        F('400', 26); c.fillText('Total financiado: ' + usd(p[4]), m + 30, y + 240);
        y += h + 16;
      });
      y += 10;
    }

    var obs = $('observaciones').value.trim();
    if (obs) {
      c.textAlign = 'left'; F('400', 34);
      var words = obs.split(/\s+/), line = '', ls = [];
      words.forEach(function (w) {
        var t = line ? line + ' ' + w : w;
        if (c.measureText(t).width > W - 2 * m - 48 && line) { ls.push(line); line = w; } else line = t;
      });
      ls.push(line);
      var oh = 70 + ls.length * 44;
      c.fillStyle = '#F5F5F5'; c.fillRect(m, y, W - 2 * m, oh);
      c.strokeStyle = '#B4B4B4'; c.lineWidth = 2; c.strokeRect(m, y, W - 2 * m, oh);
      c.fillStyle = '#505050'; F('700', 28); c.fillText('OBSERVACIONES', m + 24, y + 44);
      c.fillStyle = '#282828'; F('400', 34);
      ls.forEach(function (t, k) { c.fillText(t, m + 24, y + 90 + k * 44); });
      y += oh + 30;
    }

    y += 20;
    c.fillStyle = '#0D0D0D'; c.fillRect(0, y, W, 130);
    c.fillStyle = '#F5C518'; c.fillRect(0, y, W, 8);
    c.textAlign = 'center'; F('700', 28);
    c.fillText('HDG MAQUINARIAS AGR\u00cdCOLAS - HORACIO D. GIRAUDO', W / 2, y + 62, W - 60);
    c.fillStyle = '#8C8C8C'; F('400', 24);
    c.fillText('Vigencia sujeta a cambios sin previo aviso.', W / 2, y + 102);
    y += 130;

    var out = document.createElement('canvas');
    out.width = W; out.height = y;
    out.getContext('2d').drawImage(cv, 0, 0);
    return out;
  }

  // ---------- Exportar ----------
  async function exportar(tipo) {
    if (!datosCalculo) return;
    var cv = await dibujar();
    var nom = 'Cotizacion_HDG_' + (datosCalculo.modelo || 'Hanomag').replace(/\s+/g, '_') + '_' + new Date().toISOString().slice(0, 10);
    if (tipo === 'pdf') {
      var w = 210, h = w * cv.height / cv.width;
      var doc = new window.jspdf.jsPDF({ unit: 'mm', format: [w, h] });
      doc.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, w, h);
      doc.save(nom + '.pdf');
      showToast('PDF generado correctamente');
      return;
    }
    cv.toBlob(async function (b) {
      var f = new File([b], nom + '.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        try { await navigator.share({ files: [f] }); return; } catch (e) { if (e.name === 'AbortError') return; }
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = nom + '.jpg'; a.click();
      showToast('Imagen guardada');
    }, 'image/jpeg', 0.92);
  }
  window.generarPDF = function () { exportar('pdf'); };
})();
