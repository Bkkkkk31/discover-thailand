(() => {
  'use strict';
  const provinces = Array.isArray(window.DiscoverThailandProvinces) ? window.DiscoverThailandProvinces : [];
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svg = id => `<svg class="icon" aria-hidden="true"><use href="#h-${id}"></use></svg>`;
  const regionOrder = ['ทั้งหมด', 'ภาคเหนือ', 'ภาคกลาง', 'ภาคใต้', 'ภาคตะวันออก', 'ภาคตะวันตก', 'ภาคอีสาน'];
  const priorityIds = ['chiangmai','phuket','ayutthaya','kanchanaburi','khonkaen','bangkok','krabi','nan'];
  let selectedRegion = 'ทั้งหมด';

  function provinceUrl(p) { return `explore.html?province=${encodeURIComponent(p.id)}`; }
  function provinceTitle(p) {return p.nameTh.replace(/\s*\([^)]*\)/g,'');}
  function sortProvinces(items) {
    return [...items].sort((a,b) => {
      const ia = priorityIds.indexOf(a.id), ib = priorityIds.indexOf(b.id);
      return (ia<0?100:ia)-(ib<0?100:ib);
    });
  }
  function safeImage(url) {
    try {const parsed = new URL(url); return ['https:','http:'].includes(parsed.protocol) ? parsed.href : '';} catch(_) {return '';}
  }
  function renderGallery() {
    [['homeHeroMain','chiangmai'],['homeHeroSea','phuket'],['homeHeroCulture','ayutthaya']].forEach(([id,key]) => {
      const img = $(id), province = provinces.find(p => p.id === key);
      if (!img || !province) return;
      img.src = safeImage(province.heroImage);
      img.onerror = () => {img.style.display='none'; img.parentElement.classList.add('image-unavailable');};
    });
  }
  function renderFilters() {
    $('homeRegionFilters').innerHTML = regionOrder.filter(r => r==='ทั้งหมด' || provinces.some(p=>p.region===r)).map(region => `<button type="button" class="home-region-btn${region===selectedRegion?' selected':''}" data-region="${esc(region)}" aria-pressed="${region===selectedRegion}">${esc(region)}</button>`).join('');
  }
  function renderCards() {
    const filtered = selectedRegion === 'ทั้งหมด' ? provinces : provinces.filter(p => p.region===selectedRegion);
    const visible = sortProvinces(filtered).slice(0,6);
    $('homeProvinceGrid').innerHTML = visible.length ? visible.map((p,i) => `<a class="destination-card" href="${provinceUrl(p)}" style="--card-order:${i}"><div class="destination-image"><img src="${esc(safeImage(p.heroImage))}" alt="ภาพประกอบ${esc(provinceTitle(p))}" loading="lazy" decoding="async"><span class="destination-image-shade"></span><span class="destination-index">${String(i+1).padStart(2,'0')}</span></div><div class="destination-copy"><span>${svg('pin')}${esc(p.region)}</span><strong>${esc(provinceTitle(p))}</strong><small>${esc(p.nameEn)}</small><span class="destination-go">ดูข้อมูลจังหวัด ${svg('arrow')}</span></div></a>`).join('') : `<p class="empty-cards">ยังไม่มีจังหวัดในภูมิภาคนี้</p>`;
    $('homeProvinceGrid').querySelectorAll('.destination-image img').forEach(img => {
      img.addEventListener('error', () => { img.style.display='none'; img.closest('.destination-image').classList.add('image-unavailable'); }, { once:true });
    });
  }
  function normalized(text) {return String(text||'').trim().toLocaleLowerCase('th');}
  function lookup(q) {
    const term=normalized(q);
    if(!term) return [];
    const found=[];
    for (const p of provinces) {
      const provinceMatch = normalized(p.nameTh).includes(term) || normalized(p.nameEn).includes(term);
      if (provinceMatch) found.push({label:provinceTitle(p),subtitle:`จังหวัด · ${p.region}`,url:provinceUrl(p)});
    }
    for (const p of provinces) {
      for (const item of p.attractions || []) {
        if (normalized(item.title).includes(term)) found.push({label:item.title,subtitle:`สถานที่ · ${provinceTitle(p)}`,url:`explore.html?province=${encodeURIComponent(p.id)}&tab=attractions&place=${encodeURIComponent(item.id)}`});
      }
      for (const item of p.foods || []) {
        if (normalized(item.name).includes(term)) found.push({label:item.name,subtitle:`อาหาร · ${provinceTitle(p)}`,url:`explore.html?province=${encodeURIComponent(p.id)}&tab=foods&q=${encodeURIComponent(q)}`});
      }
    }
    return found.slice(0,7);
  }
  function showSuggestions() {
    const input=$('homeSearchInput'), list=$('homeSuggestions');
    const text=input.value.trim(); const result=lookup(text);
    if (!text || !result.length) {list.hidden=true;list.replaceChildren();input.setAttribute('aria-expanded','false');return;}
    list.innerHTML = result.map(item=>`<a role="option" class="suggestion-link" href="${esc(item.url)}">${svg('search')}<span><strong>${esc(item.label)}</strong><small>${esc(item.subtitle)}</small></span>${svg('arrow')}</a>`).join('');
    list.hidden=false;input.setAttribute('aria-expanded','true');
  }
  function submitSearch(e) {
    e.preventDefault();
    const q=$('homeSearchInput').value.trim();
    if(!q) { $('homeSearchInput').focus(); return; }
    const first=lookup(q)[0];
    window.location.href = first?.url || `explore.html?tab=attractions&q=${encodeURIComponent(q.slice(0,120))}`;
  }
  function updateHomeScale() {
    const width = window.innerWidth || 1920;
    const height = window.innerHeight || 1080;
    const scale = width >= 1040 ? Math.min(1, Math.max(.82, Math.min(width / 1920, height / 1080))) : 1;
    document.documentElement.style.setProperty('--home-scale', String(scale));
  }
  function setup() {
    updateHomeScale();
    window.addEventListener('resize',updateHomeScale,{passive:true});
    if(!provinces.length) { $('homeProvinceGrid').textContent = 'ไม่สามารถโหลดข้อมูลจังหวัดได้ กรุณาตรวจสอบไฟล์ provinces.js';return; }
    $('homeProvinceCount').textContent=String(provinces.length);
    $('homeRegionCount').textContent=String(new Set(provinces.map(p=>p.region)).size);
    renderGallery();renderFilters();renderCards();
    $('homeRegionFilters').addEventListener('click', e=>{
      const btn=e.target.closest('[data-region]');if(!btn)return;
      selectedRegion=btn.dataset.region;renderFilters();renderCards();
    });
    $('homeSearchInput').addEventListener('input',showSuggestions);
    $('homeSearchInput').addEventListener('focus',showSuggestions);
    $('homeSearchInput').addEventListener('keydown', e=>{
      if(e.key==='Escape'){$('homeSuggestions').hidden=true;$('homeSearchInput').setAttribute('aria-expanded','false');}
      if(e.key==='ArrowDown' && !$('homeSuggestions').hidden) {e.preventDefault();$('homeSuggestions').querySelector('a')?.focus();}
    });
    $('homeSuggestions').addEventListener('keydown',e=>{if(e.key==='Escape'){$('homeSuggestions').hidden=true;$('homeSearchInput').focus();}});
    $('homeSearchForm').addEventListener('submit',submitSearch);
    document.addEventListener('click', e=>{if(!e.target.closest('#homeSearchForm')) {$('homeSuggestions').hidden=true;$('homeSearchInput').setAttribute('aria-expanded','false');}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
