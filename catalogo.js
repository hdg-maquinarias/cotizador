/* Catálogo de productos HDG. Para actualizar precios, reemplazar catalogo.xlsx conservando la hoja Catalogo y sus columnas. */
(function () {
  var style = document.createElement('style');
  style.textContent = '.catalog-box{margin:-4px 0 16px;padding:14px;background:var(--gray-900);border:1px solid var(--gray-700);border-radius:10px}.catalog-title{font-family:"Barlow Condensed",sans-serif;color:var(--gold);font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}.catalog-cats{display:flex;gap:7px;overflow:auto;padding:2px 0 9px}.catalog-cat{white-space:nowrap;background:var(--gray-800);border:1px solid var(--gray-700);color:var(--gray-400);border-radius:20px;padding:6px 11px;font:600 12px Barlow,sans-serif;cursor:pointer}.catalog-cat.active{border-color:var(--gold);color:var(--gold)}.catalog-select{width:100%;background:var(--gray-800);border:1.5px solid var(--gray-700);border-radius:8px;padding:11px 12px;color:var(--white);font:14px Barlow,sans-serif}.catalog-status{font-size:11px;color:var(--gray-400);margin-top:7px}';
  document.head.appendChild(style);
  var model = document.getElementById('modelo');
  if (!model) return;
  var group = model.closest('.input-group');
  var box = document.createElement('section'); box.className = 'catalog-box';
  box.innerHTML = '<div class="catalog-title">Buscar equipo en la lista</div><input id="catalogSearch" class="catalog-select" type="search" placeholder="Buscar modelo, código o descripción"><div id="catalogCats" class="catalog-cats" aria-label="Categorías"></div><select id="catalogResults" class="catalog-select" size="5" aria-label="Productos"></select><div id="catalogStatus" class="catalog-status">Cargando lista de precios…</div>';
  group.insertAdjacentElement('afterend', box);
  var all = [], category = '';
  var search = document.getElementById('catalogSearch'), cats = document.getElementById('catalogCats'), results = document.getElementById('catalogResults'), status = document.getElementById('catalogStatus');
  function renderCats() {
    var values = Array.from(new Set(all.map(function(p){return p.linea;}).filter(Boolean))).sort();
    cats.innerHTML = '';
    ['Todas'].concat(values).forEach(function(name){
      var b=document.createElement('button'); b.type='button'; b.className='catalog-cat'+((name==='Todas'&&!category||name===category)?' active':''); b.textContent=name;
      b.onclick=function(){category=name==='Todas'?'':name;renderCats();renderResults();}; cats.appendChild(b);
    });
  }
  function renderResults(){
    var q=search.value.trim().toLocaleLowerCase();
    var matches=all.filter(function(p){return (!category||p.linea===category)&&(!q||[p.modelo,p.codigo,p.descripcion,p.marca].join(' ').toLocaleLowerCase().includes(q));}).slice(0,300);
    results.innerHTML='';
    matches.forEach(function(p){var o=document.createElement('option');o.value=String(all.indexOf(p));o.textContent=[p.modelo,p.descripcion].filter(Boolean).join(' — ')+(p.contado>0?' · USD '+Number(p.contado).toLocaleString('es-AR'):'');results.appendChild(o);});
    status.textContent=matches.length+' productos'+(matches.length===300?' (mostrando hasta 300; buscá para afinar)':'');
  }
  function setPrice(id, value){var el=document.getElementById(id); if(el){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));}}
  results.addEventListener('change',function(){var p=all[Number(results.value)];if(!p)return;model.value=p.descripcion||p.modelo||'';model.dispatchEvent(new Event('input',{bubbles:true}));setPrice('precioContado',p.contado);setPrice('precioE',p.contado);});
  search.addEventListener('input',renderResults);
  function load(){
    var s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload=function(){fetch('catalogo.xlsx?v='+Date.now()).then(function(r){if(!r.ok)throw Error('No se pudo cargar catalogo.xlsx');return r.arrayBuffer();}).then(function(buf){
      var wb=XLSX.read(buf,{type:'array'}), ws=wb.Sheets['Catalogo']; if(!ws)throw Error('Falta la hoja Catalogo');
      all=XLSX.utils.sheet_to_json(ws,{defval:''}).map(function(r){return {marca:String(r.marca||'').trim(),linea:String(r.linea||'').trim(),codigo:String(r.codigo||'').trim(),modelo:String(r.modelo||'').trim(),descripcion:String(r.descripcion||'').trim(),contado:Number(r.contado)||0};}).filter(function(p){return p.descripcion||p.modelo;});
      renderCats();renderResults();
    }).catch(function(e){status.textContent='No se pudo cargar la lista. Podés ingresar el producto y el precio manualmente.';console.error('Catálogo HDG:',e);});};
    s.onerror=function(){status.textContent='No se pudo cargar el lector de Excel. Ingreso manual disponible.';}; document.head.appendChild(s);
  }
  load();
})();
