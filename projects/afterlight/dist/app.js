(function () {
  'use strict';
  const M = window.AfterlightModel;
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = M.format;
  const icons = {
    download:'<path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 15v5h14v-5"/>',
    print:'<path d="M7 8V3h10v5M7 17H4V9h16v8h-3"/><path d="M7 14h10v7H7z"/><path d="M17 11h.01"/>',
    shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    battery:'<rect x="2" y="6" width="17" height="12" rx="2"/><path d="M22 10v4M6 10v4m4-4v4m4-4v4"/>',
    water:'<path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    sliders:'<path d="M4 7h4m4 0h8M4 17h8m4 0h4"/><circle cx="10" cy="7" r="2"/><circle cx="14" cy="17" r="2"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
    phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 5h4m-2 14h.01"/>',
    light:'<path d="M9 18h6m-5 3h4M8.5 14a6 6 0 1 1 7 0L15 16H9Z"/>',
    fan:'<circle cx="12" cy="12" r="2"/><path d="M10 10C5 3 15 0 16 5c.5 2-1 4-3 5M14 12c8-1 7 9 2 8-2-.5-3-3-3-6M11 14c-3 7-11 1-7-3 2-2 4-1 6 0"/>',
    laptop:'<path d="M5 4h14v12H5zM2 20h20l-3-4H5z"/>',
    wifi:'<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0M12 20h.01"/>',
    fridge:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 9h14M8 5v1m0 7v3"/>',
    plug:'<path d="M8 3v4m8-4v4M6 7h12v3a6 6 0 0 1-12 0Zm6 9v6"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>',
    bag:'<path d="M5 7h14l2 14H3zM8 7V6a4 4 0 0 1 8 0v1"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    people:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-14a3 3 0 0 1 0 6m2 8v-3a5 5 0 0 0-2-4"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    file:'<path d="M14 2H5v20h14V7zM14 2v5h5M8 12h8m-8 4h6"/>',
    upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    offline:'<path d="m2 2 20 20M2 8a16 16 0 0 1 3-2m4-2a16 16 0 0 1 13 4M5 12a11 11 0 0 1 4-2m5 0a11 11 0 0 1 5 2M8.5 16a5.5 5.5 0 0 1 7 0M12 20h.01"/>',
    reset:'<path d="M3 11a9 9 0 1 1 3 7M3 4v7h7"/>'
  };
  function icon(name) { return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${icons[name] || icons.plug}</svg>`; }
  function fillIcons(context = document) { $$('[data-icon]', context).forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
  const sources = {
    water:{title:'CDC · Emergency water supply',url:'https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html',detail:'One US gallon per person per day for at least 3 days. Store more for heat, illness, pregnancy, pets, and individual needs; try for 2 weeks if possible.'},
    food:{title:'FDA · Food safety during outages',url:'https://www.fda.gov/food/buy-store-serve-safe-food/food-and-water-safety-during-power-outages-and-floods',detail:'Unopened refrigeration: about 4 hours. A closed full freezer: about 48 hours, or 24 hours if half full. Temperature and time determine what can be kept.'},
    co:{title:'CDC · Generator safety',url:'https://www.cdc.gov/natural-disasters/psa-toolkit/use-a-generator-safely.html',detail:'Operate fuel-powered generators outdoors, at least 20 feet from doors, windows, and vents. Never use one in a home, garage, or basement.'},
    outage:{title:'Ready.gov · Power outages',url:'https://www.ready.gov/power-outages',detail:'Prepare alternative charging and lighting, follow local instructions, and plan a safer destination when conditions require it.'},
    kit:{title:'Ready.gov · Build a kit',url:'https://www.ready.gov/kit',detail:'Emergency supplies, shelf-stable food, lighting, radio, batteries, hygiene, and first aid.'},
    medical:{title:'FDA · Medical devices in disasters',url:'https://www.fda.gov/medical-devices/emergency-situations-medical-devices/fda-offers-tips-about-medical-devices-and-natural-disasters',detail:'Check backup compatibility and instructions with the equipment supplier and care team. Arrange an individual emergency plan.'},
    pets:{title:'Ready.gov · Prepare your pets',url:'https://www.ready.gov/pets',detail:'Include pet food, water, supplies, and a suitable destination in your emergency plan.'},
    disability:{title:'Ready.gov · People with disabilities',url:'https://www.ready.gov/people-disabilities',detail:'Plan around individual access, support, communication, and transport needs.'}
  };
  let seed = null;
  try { const raw = $('#afterlight-seed')?.textContent; if (raw) seed = JSON.parse(raw); } catch (_) {}
  const STORAGE_KEY = 'afterlight-plan-v1' + (seed?.id ? '-' + String(seed.id).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80) : window.AFTERLIGHT_PORTABLE ? '-offline' : '');
  let state = M.defaults();
  let storageAvailable = true;
  let saved = false;
  let loadIssue = '';
  let view = ['overview','power','checklist'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
  let checklistFilter = 'all';
  let modalReturn = null;
  let toastTimer;
  let announceTimer;
  let undoDevices = null;
  let appOfflineReady = Boolean(window.AFTERLIGHT_PORTABLE);
  // An embedded plan must load even when this browser blocks local storage.
  if (seed?.plan) {
    try { state = M.sanitize(seed.plan); }
    catch (_) { loadIssue = 'The embedded plan could not be read. An editable example is open.'; }
  }
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) { state = M.sanitize(JSON.parse(current)); saved = true; }
    const testKey = STORAGE_KEY + '-test'; localStorage.setItem(testKey, '1'); localStorage.removeItem(testKey);
  } catch (error) {
    if (error.name === 'SecurityError' || error.name === 'QuotaExceededError') storageAvailable = false;
    else loadIssue = 'The saved plan could not be read. The example is open; your old data has not been overwritten.';
  }
  function persist(markEdited = true) {
    if (markEdited) state.example = false;
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); saved = true; storageAvailable = true; }
    catch (_) { saved = false; storageAvailable = false; }
    updateSaveStatus();
  }
  function updateSaveStatus() {
    $('#save-status').textContent = !storageAvailable ? 'Save a file to keep changes' : state.example ? 'Example plan' : saved ? 'Saved on this device' : 'Your plan';
  }
  function runtimeValue(hours) {
    if (hours === null) return '—';
    if (hours > 9999) return '9,999+';
    if (hours > 0 && hours < 1) return '<1';
    return fmt(Math.floor(hours), 0);
  }
  function duration(hours) {
    if (hours === null) return 'No devices selected';
    if (hours <= 0) return '0 hours';
    if (hours < 1) return 'less than 1 hour';
    if (hours > 24 * 365) return 'over 1 year';
    const h = Math.floor(hours), d = Math.floor(h / 24), remainder = h % 24;
    return d ? `${d} ${d === 1 ? 'day' : 'days'}${remainder ? ` ${remainder} ${remainder === 1 ? 'hour' : 'hours'}` : ''}` : `${h} ${h === 1 ? 'hour' : 'hours'}`;
  }
  function numInput(key, label, unit, options = {}) {
    const [min,max] = M.LIMITS[key];
    return `<label class="field ${options.className || ''}" for="${key}"><span class="field-label">${label}${options.suffix || ''}</span><span class="input-unit"><input class="number-input" id="${key}" data-field="${key}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${options.step ?? 1}" value="${state[key]}"${options.describedBy ? ` aria-describedby="${options.describedBy}"` : ''}><span>${unit}</span></span>${options.hint ? `<span class="helper">${options.hint}</span>` : ''}</label>`;
  }
  function mobileSummary() {
    const c=M.calculate(state);
    return `<div><span>Battery estimate</span><strong>${runtimeValue(c.runtimeHours)} <small>hours</small></strong></div><div><span>Water on hand</span><strong>${runtimeValue(c.waterHours)} <small>hours</small></strong></div>`;
  }
  function scenarioPanel() {
    return `<aside class="panel scenario-panel" aria-labelledby="scenario-title"><div class="panel-title"><h2 id="scenario-title">Make it yours</h2><span class="small-icon">${icon('sliders')}</span></div><p class="helper scenario-hint">${state.example ? '<span class="example-label">EXAMPLE</span> Edit these amounts to match your household.' : 'Use the supplies and equipment you actually have.'}</p>
      <div class="mobile-summary" id="mobile-summary" aria-label="Live estimate">${mobileSummary()}</div><div class="scenario-form"><div class="field-pair"><label class="field" for="people"><span class="field-label">People</span><span class="stepper"><button type="button" id="step-people-less" data-step="people:-1" aria-label="One fewer person"${state.people <= 1 ? ' disabled' : ''}>−</button><input id="people" data-field="people" type="number" min="1" max="20" step="1" inputmode="numeric" value="${state.people}"><button type="button" id="step-people-more" data-step="people:1" aria-label="One more person"${state.people >= 20 ? ' disabled' : ''}>+</button></span></label><label class="field" for="days"><span class="field-label">Plan for</span><span class="stepper"><button type="button" id="step-days-less" data-step="days:-1" aria-label="One fewer day"${state.days <= 1 ? ' disabled' : ''}>−</button><input id="days" data-field="days" type="number" min="1" max="14" step="1" inputmode="numeric" value="${state.days}" aria-label="Outage duration in days"><button type="button" id="step-days-more" data-step="days:1" aria-label="One more day"${state.days >= 14 ? ' disabled' : ''}>+</button></span><span class="helper">days without power</span></label></div>
      <label class="field home-field" for="home"><span class="field-label">Home</span><select id="home" data-field="home"><option value="apartment"${state.home === 'apartment' ? ' selected' : ''}>Apartment</option><option value="house"${state.home === 'house' ? ' selected' : ''}>House</option><option value="other"${state.home === 'other' ? ' selected' : ''}>Other</option></select></label>
      <div class="section-rule"></div>
      ${numInput('water','Stored water','US gal',{className:'water-field',step:0.1, hint:'Count safe, usable water.'})}
      ${numInput('batteryWh','Battery capacity','Wh',{className:'battery-overview-field',step:1,hint:'Find Wh on the battery label.'})}
      <div class="section-rule"></div><div class="needs-section"><p class="needs-title">Anything else to plan for?</p><div class="needs-grid">${[['pets','Pets'],['medicine','Refrigerated medicine'],['mobility','Help with mobility'],['medical','Power-dependent care']].map(([key,label])=>`<label class="check-label"><input type="checkbox" id="need-${key}" data-need="${key}"${state.needs[key] ? ' checked' : ''}><span>${label}</span></label>`).join('')}</div></div>
      <details class="details extra-water-field"${state.extraWater > 0 || state.needs.pets ? ' open' : ''}><summary>Extra water needs</summary>${numInput('extraWater','Extra for this household','gal/day',{step:0.1,hint:'Add water for pets, heat, or individual needs. Included in your total.'})}</details>
      </div><div class="scenario-bottom">${icon('lock')}<span>Your inputs stay in this browser. Export a file to keep a separate copy.</span></div></aside>`;
  }
  function chart(c, essentials) {
    const width = 680, height = 194, left = 44, right = 10, top = 16, bottom = 29;
    const w = width-left-right, h = height-top-bottom, max = Math.max(c.usableStoredWh,1), target = c.targetHours;
    const point = (hours, essential) => [left + hours/target*w, top + (1-M.remainingAt(state,hours,essential)/max)*h];
    const path = essential => {
      const steps = [...Array(49)].map((_,i)=>target*i/48);
      const runtime = essential ? essentials.runtimeHours : c.runtimeHours;
      if (runtime !== null && runtime > 0 && runtime < target) steps.push(runtime);
      return steps.sort((a,b)=>a-b).map((x,i)=>`${i ? 'L' : 'M'}${point(x,essential).map(v=>v.toFixed(2)).join(',')}`).join(' ');
    };
    const line = path(false), essentialPath = path(true), endY = top+h;
    const grid = [1,.5,0].map(f=>`<line x1="${left}" x2="${width-right}" y1="${top+(1-f)*h}" y2="${top+(1-f)*h}" stroke="#365363" stroke-width="1"/><text class="chart-text" x="${left-9}" y="${top+(1-f)*h+4}" text-anchor="end">${f*100}%</text>`).join('');
    const ticks = [0,.333333,.666667,1].map(f=>`<text class="chart-text" x="${left+w*f}" y="${height-6}" text-anchor="${f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}">${fmt(target*f,0)}h</text>`).join('');
    let depletion = '';
    if(c.runtimeHours !== null && c.runtimeHours > 0 && c.runtimeHours < target) {
      const x = point(c.runtimeHours,false)[0];
      const anchor = x > width-140 ? 'end' : 'start';
      const labelX = x + (anchor === 'end' ? -7 : 7);
      depletion = `<line x1="${x}" x2="${x}" y1="${top+8}" y2="${endY}" stroke="#ffbd59" stroke-dasharray="3 5" stroke-opacity=".5"/><circle cx="${x}" cy="${endY}" r="4" fill="#ffbd59"/><text class="chart-label" x="${labelX}" y="${top+16}" text-anchor="${anchor}">Reserve at ~${runtimeValue(c.runtimeHours)}h</text>`;
    }
    return `<svg class="energy-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Estimated usable battery energy over ${state.days} days. Selected devices reach the reserve after ${escape(duration(c.runtimeHours))}. Essentials only: ${escape(duration(essentials.runtimeHours))}. Daily use is averaged evenly over time."><defs><linearGradient id="battery-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffbd59" stop-opacity=".15"/><stop offset="100%" stop-color="#ffbd59" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${line} L${width-right},${endY} L${left},${endY} Z" fill="url(#battery-fill)"/>${essentials.hasLoad ? `<path d="${essentialPath}" fill="none" stroke="#91e0d2" stroke-width="2" stroke-dasharray="6 5"/>` : ''}<path d="${line}" fill="none" stroke="#ffbd59" stroke-width="3" stroke-linejoin="round"/>${depletion}${ticks}</svg>`;
  }
  function overviewResults() {
    const c = M.calculate(state), e = M.calculate(state,true), checks = M.checklist(state), complete = checks.filter(i=>state.checked[i.id]).length;
    const powerLabel = !c.hasLoad ? 'Select devices' : c.outputExceeded ? 'Check output limit' : c.coversPower ? 'Energy target met' : 'A gap to close';
    const dayPercent = c.hasLoad ? Math.min(100,(c.runtimeHours/c.targetHours)*100) : 0;
    return `<div class="dashboard">
      ${loadIssue ? `<div class="notice">${escape(loadIssue)}</div>` : ''}
      ${!storageAvailable ? '<div class="notice">This browser cannot save your changes automatically. Use <strong>Save your plan</strong> to keep a copy.</div>' : ''}
      ${state.needs.medical ? `<div class="notice notice-row">${icon('shield')}<div><strong>Put power-dependent care first.</strong>Arrange a backup and a safe destination with the care team. Runtime estimates here cannot validate medical equipment support.</div></div>` : ''}
      <section class="energy-card" aria-labelledby="energy-title"><div class="energy-top"><div><p class="eyebrow">YOUR POWER OUTLOOK</p><h2 id="energy-title">Keep the important things going.</h2></div><span class="outline-tag">${state.days}-day plan</span></div><div class="energy-numbers"><span class="energy-number">${runtimeValue(c.runtimeHours)}</span><span class="energy-unit">${c.hasLoad ? 'hours of power' : 'no active load'}</span></div><p class="energy-description">${c.hasLoad ? `About ${duration(c.runtimeHours)} to your ${state.reserve}% reserve, with ${c.active.length} selected device ${c.active.length === 1 ? 'type' : 'types'}.` : 'Choose a device in Power lab to estimate your battery runtime.'}</p>${chart(c,e)}<div class="chart-legend"><span><i class="legend-line"></i>Selected devices</span><span><i class="legend-line legend-line-teal"></i>Essentials only</span></div><div class="energy-foot"><span>Usable energy remaining · daily-average estimate</span><button class="text-button" type="button" data-action="method">See assumptions ${icon('info')}</button></div></section>
      <div class="stat-grid"><section class="panel stat-card" aria-labelledby="water-title"><div class="stat-top"><span class="stat-label" id="water-title">${icon('water')}Water supply</span><span class="status-tag${c.coversWater ? ' good' : ''}">${c.coversWater ? 'Baseline covered' : 'Add '+fmt(c.waterGap)+' gal'}</span></div><div class="stat-number">${fmt(state.water)} <small>of ${fmt(c.waterTarget)} US gallons</small></div><div class="meter" role="progressbar" aria-label="Water baseline covered" aria-valuenow="${Math.round(Math.min(100,state.water/c.waterTarget*100))}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.min(100,state.water/c.waterTarget*100)}%"></span></div><div class="stat-foot"><span>At your planned daily use</span><strong>~${duration(c.waterHours)}</strong></div></section>
      <section class="panel stat-card" aria-labelledby="power-title"><div class="stat-top"><span class="stat-label" id="power-title">${icon('battery')}Battery coverage</span><span class="status-tag${c.coversPower ? ' good' : ''}">${powerLabel}</span></div><div class="stat-number">${runtimeValue(c.runtimeHours)} <small>of ${c.targetHours} planned hours</small></div><div class="meter teal" role="progressbar" aria-label="Battery time target covered" aria-valuenow="${Math.round(dayPercent)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${dayPercent}%"></span></div><div class="stat-foot"><span>${fmt(c.loadWhDay,0)} Wh/day to devices</span><button class="text-button" style="font-size:12px;min-height:0;padding:0" type="button" data-goto="power">Adjust devices ↗</button></div></section></div>
      ${nextActions(c,e,complete,checks.length)}
      <p class="quiet-notice">Water starts at 1 US gallon per person per day. Your plan includes ${fmt(state.extraWater)} extra gal/day. CDC advises keeping at least a 3-day supply. <a href="${sources.water.url}" target="_blank" rel="noopener noreferrer">CDC guidance ↗</a></p>
      </div>`;
  }
  function nextActions(c,e,complete,total) {
    const actions = [];
    if (c.waterGap > 0) actions.push({title:`Set aside ${fmt(c.waterGap)} more US ${c.waterGap === 1 ? 'gallon' : 'gallons'} of water.`,detail:`That brings this household to its ${state.days}-day baseline of ${fmt(c.waterTarget)} gallons.`,button:'Update your stored water',action:'water-focus'});
    if (c.outputExceeded) actions.push({title:'Check your battery’s output limit.',detail:`Selected devices total ${fmt(c.simultaneousW,0)} W if they run together, above your ${fmt(state.maxOutputW,0)} W limit. Starting surges may need more.`,button:'Review devices',goto:'power'});
    else if (!c.hasLoad) actions.push({title:'Add the devices you want to keep running.',detail:'Use the wattage label or a measured average, and estimate daily use.',button:'Open Power lab',goto:'power'});
    else if (!c.coversPower && e.hasLoad && e.runtimeHours > c.runtimeHours + 1) actions.push({title:`Your essentials could run for ~${runtimeValue(e.runtimeHours)} hours.`,detail:`Compare the devices marked with a star in Power lab. Keep any necessary cooling or care in your plan.`,button:'Explore the trade-off',goto:'power'});
    else if (!c.coversPower) actions.push({title:'Arrange less use or a verified way to recharge.',detail:`This plan needs about ${fmt(c.shortageWh,0)} Wh more stored energy over ${state.days} days, under the current assumptions.`,button:'Review power use',goto:'power'});
    if(state.needs.pets && state.extraWater === 0) actions.push({title:'Add a water allowance for your pets.',detail:'The current water total covers people only. Enter your pets’ needs under Extra water.',button:'Update water needs',action:'extra-water-focus'});
    if(actions.length < 3 && complete < total) actions.push({title:`${total-complete} ${total-complete === 1 ? 'item' : 'items'} left on your checklist.`,detail:'Set up the basics, your check-in person, and a place to go if home becomes unsafe.',button:'Work through your checklist',goto:'checklist'});
    if (!actions.length) actions.push({title:'Your entered targets are covered.',detail:'Test the setup and keep a copy offline. These calculations and checkmarks do not certify readiness for every situation.',button:'Save a copy',action:'save'});
    return `<section class="panel actions-card"><div class="actions-heading"><h2>Make the next move.</h2><span class="muted">Small steps, real progress</span></div>${actions.slice(0,3).map((a,i)=>`<div class="action-row"><span class="action-number">0${i+1}</span><div class="action-content"><h3>${a.title}</h3><p>${a.detail}</p><button class="text-button" type="button" ${a.goto ? `data-goto="${a.goto}"` : `data-action="${a.action}"`}>${a.button} <span aria-hidden="true">→</span></button></div></div>`).join('')}</section>`;
  }
  function renderOverview() { return `<section class="view-section workspace" aria-label="Your outage plan">${scenarioPanel()}<div id="overview-results">${overviewResults()}</div></section>`; }
  function batterySettings() {
    return `<aside class="panel power-settings" aria-labelledby="battery-settings-title"><h3 id="battery-settings-title">Your battery</h3><p class="helper">Use your equipment’s actual specifications.</p><div class="battery-form">
      <div class="field">${numInput('batteryWh','Rated capacity','Wh',{step:1}).replace('class="field "','class="field"')}<div class="capacity-chips" aria-label="Example battery capacities">${[250,500,1000,2000].map(v=>`<button class="capacity-chip${state.batteryWh === v ? ' selected' : ''}" type="button" id="capacity-${v}" data-capacity="${v}">${fmt(v,0)}</button>`).join('')}</div></div>
      <label class="field charge-field" for="charge"><span class="field-label">Starting charge <span class="range-value" id="charge-display">${state.charge}%</span></span><input class="range-input" id="charge" data-field="charge" type="range" min="0" max="100" step="1" value="${state.charge}"><span class="range-labels"><span>Empty</span><span>Full</span></span></label>
      <div class="field-pair">${numInput('reserve','Keep in reserve','%',{step:1})}${numInput('maxOutputW','Output limit','W',{step:1})}</div><p class="helper" style="grid-column:1/-1">Output limit is continuous AC watts, not battery capacity. Enter 0 if unknown.</p>
      <details class="details"><summary>Losses & assumptions</summary><p class="helper">Defaults are planning assumptions. Replace them with measured values if you can.</p><div class="field-pair">${numInput('efficiency','Conversion efficiency','%',{step:1})}${numInput('idleW','Battery idle draw','W',{step:0.1})}</div><p class="helper">Idle draw assumes the battery stays on 24 hours/day while devices are selected. No recharging is included.</p><button class="text-button" type="button" data-action="method">Show the calculation →</button></details>
      </div></aside>`;
  }
  function deviceTable() {
    return `<section class="panel device-panel" aria-labelledby="devices-title"><div class="device-heading"><div><h3 id="devices-title" tabindex="-1">What stays on?</h3><p class="helper">Example draws. Edit for your real devices.</p></div><button class="button button-white" type="button" data-action="add-device">${icon('plus')}Add device</button></div><table class="device-table"><caption class="sr-only">Devices, estimated running watts, hours used each day, quantity, and whether to keep them in the essentials plan.</caption><thead><tr><th scope="col">Device</th><th scope="col">Watts</th><th scope="col">Hours/day</th><th scope="col">Qty</th><th scope="col"><span class="sr-only">Essential</span>★</th></tr></thead><tbody>${state.devices.map(d=>`<tr class="${d.enabled ? '' : 'device-disabled'}"><td><div class="device-cell"><input class="device-toggle" id="include-${escape(d.id)}" type="checkbox" data-device="${escape(d.id)}" data-prop="enabled" aria-label="Include ${escape(d.name)}"${d.enabled ? ' checked' : ''}><span class="device-symbol">${icon(d.icon)}</span><div><div class="custom-name"><span class="device-name">${escape(d.name)}</span>${d.category === 'custom' ? `<button class="remove-device" type="button" data-remove="${escape(d.id)}" aria-label="Remove ${escape(d.name)}">${icon('trash')}</button>` : ''}</div><div class="device-detail"><span data-device-wh="${escape(d.id)}">${d.enabled ? fmt(M.deviceWh(d),0)+' Wh/day' : 'Not in this plan'}</span></div></div></div></td>${[['watts','Watts',0,10000,'any'],['hours','Hours / day',0,24,'any'],['quantity','Quantity',1,20,1]].map(([key,label,min,max,step])=>`<td data-label="${label}"><input class="device-input" id="device-${escape(d.id)}-${key}" data-device="${escape(d.id)}" data-prop="${key}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${d[key]}" aria-label="${escape(d.name)} ${label}" title="${escape(d.note)}"></td>`).join('')}<td><button class="essential-button" id="star-${escape(d.id)}" type="button" data-essential="${escape(d.id)}" aria-label="Keep ${escape(d.name)} in essentials" aria-pressed="${d.essential}">${icon('star')}</button></td></tr>`).join('') || '<tr><td colspan="5"><div class="empty-state"><h3>Your devices go here.</h3><p>Add a light, a phone charger, or another device to start.</p></div></td></tr>'}</tbody></table><div class="device-panel-foot"><span>${icon('star')} Star the devices you need to keep.</span><span>Device use <strong id="device-total">${fmt(M.calculate(state).loadWhDay,0)} Wh/day</strong></span></div></section>`;
  }
  function powerResults() {
    const c=M.calculate(state), e=M.calculate(state,true);
    const sorted=[...c.active].sort((a,b)=>M.deviceWh(b)-M.deviceWh(a));
    const optional=c.active.filter(d=>!d.essential);
    const increase=e.hasLoad && c.runtimeHours !== null ? Math.max(0,e.runtimeHours-c.runtimeHours) : 0;
    return `<section class="panel power-summary" aria-labelledby="power-result-title"><div class="power-summary-top"><div><p class="eyebrow" style="color:var(--muted)">ESTIMATED BATTERY RUNTIME</p><h3 class="power-summary-number" id="power-result-title">${runtimeValue(c.runtimeHours)} <small>${c.hasLoad ? 'hours' : 'no active load'}</small></h3><p class="helper">${c.hasLoad ? `About ${duration(c.runtimeHours)} · target ${c.targetHours} hours` : 'Include a device above to calculate runtime.'}</p></div><span class="status-tag${c.coversPower ? ' good' : ''}">${c.outputExceeded ? 'Output needs review' : c.coversPower ? 'Energy target met' : c.hasLoad ? 'Below time target' : 'Add a device'}</span></div>
      <div class="energy-flow"><div><span>Stored energy to use</span><strong>${fmt(c.usableStoredWh,0)} <small>Wh</small></strong></div><div><span>Device use / day</span><strong>${fmt(c.loadWhDay,0)} <small>Wh</small></strong></div><div><span>Battery draw / day</span><strong>${fmt(c.batteryWhDay,0)} <small>Wh</small></strong></div></div>
      ${c.hasLoad && optional.length && e.hasLoad ? `<div class="compare-box"><div><h4>Essentials only: ~${runtimeValue(e.runtimeHours)} hours</h4><p>About ${fmt(Math.floor(increase),0)} extra hours by leaving ${optional.length} optional ${optional.length === 1 ? 'device' : 'devices'} off. Keep necessary cooling and care included.</p></div><button class="text-button" type="button" data-action="essentials">Use essentials ${icon('arrow')}</button></div>` : ''}
      ${c.hasLoad ? `<div class="load-bars" aria-label="Daily device energy use">${sorted.map(d=>`<div class="load-row"><span>${escape(d.name)}</span><div class="load-bar" aria-hidden="true"><i style="width:${M.deviceWh(d)/c.loadWhDay*100}%"></i></div><span style="text-align:right">${fmt(M.deviceWh(d),0)} Wh</span></div>`).join('')}</div>` : '<p class="helper" style="margin-top:17px">No load means there is no meaningful runtime estimate. Standby self-discharge is not modeled.</p>'}
      ${c.outputExceeded ? `<div class="notice output-warning"><strong>Selected running loads exceed the output limit.</strong>If all selected devices run together, they draw ${fmt(c.simultaneousW,0)} W. Your entered limit is ${fmt(state.maxOutputW,0)} W. Reduce simultaneous use and check each device’s starting surge.</div>` : c.hasLoad ? `<p class="helper" style="margin-top:18px">${fmt(c.simultaneousW,0)} W if selected devices run together${state.maxOutputW ? ` · ${fmt(state.maxOutputW,0)} W entered output limit` : ' · output limit unknown'}. Starting surges and outlet compatibility still need checking.</p>` : ''}
      ${state.charge <= state.reserve && c.hasLoad ? '<div class="notice output-warning"><strong>The starting charge is at or below your reserve.</strong>No energy is available above the reserve. Charge the battery or review your assumptions.</div>' : ''}
      <p class="helper" style="margin-top:13px">Runtime averages daily use evenly across 24 hours. Actual timing, temperature, battery condition, and cycling change results. No solar, utility, or other recharging is assumed.</p></section>`;
  }
  function renderPower() { return `<section class="view-section" aria-label="Power lab"><div class="view-heading"><div><h2>Make every watt count.</h2><p>See what uses your battery, decide what matters, and find a setup that lasts longer.</p></div><button class="button button-white" data-goto="overview" type="button">Back to your plan ${icon('arrow')}</button></div><div class="power-workspace"><div class="power-main">${deviceTable()}<div id="power-results">${powerResults()}</div><div class="notice notice-row">${icon('shield')}<div><strong>A battery station and a fuel generator are different.</strong>Fuel-powered generators must stay outdoors, at least 20 feet from doors, windows, and vents. Never run one in a home, garage, or basement. <a href="${sources.co.url}" target="_blank" rel="noopener noreferrer">CDC guidance ↗</a></div></div></div>${batterySettings()}</div></section>`; }
  function foodCard() { return `<section class="panel food-card"><h3>Keep the cold in.</h3><p class="helper">Approximate hold times with the doors kept closed:</p><div class="food-timing"><div><strong>4 <small>hrs</small></strong><span>Refrigerator</span></div><div><strong>24 <small>hrs</small></strong><span>Half-full freezer</span></div><div><strong>48 <small>hrs</small></strong><span>Full freezer</span></div></div><p class="helper important">Use a thermometer, never a taste test. These are food guidelines, not medication storage limits.</p><button class="text-button" type="button" data-action="food">When to keep or discard food ↗</button></section>`; }
  function renderChecklist() {
    const items=M.checklist(state), complete=items.filter(i=>state.checked[i.id]).length;
    const groups=[['supplies','The things to have','bag'],['before','Before the lights go out','clock'],['people','The people & the plan','people']];
    const visible=items.filter(i=>checklistFilter==='all' || !state.checked[i.id]);
    return `<section class="view-section" aria-label="Your personalized checklist"><div class="view-heading"><div><h2>Good plans are made of small steps.</h2><p>A checklist for ${state.people} ${state.people === 1 ? 'person' : 'people'}, ${state.days} days, and the needs you selected. Check an item only once you have arranged it.</p></div><label class="check-label"><input id="remaining-only" type="checkbox" data-filter="remaining"${checklistFilter==='remaining'?' checked':''}><span>Only show what’s left</span></label></div><div class="checklist-layout"><div class="checklist-main">${groups.map(([key,title,ic])=>{const group=visible.filter(i=>i.group===key);const total=items.filter(i=>i.group===key);return group.length ? `<section class="panel check-group"><div class="check-group-heading"><h3>${icon(ic)}${title}</h3><span>${total.filter(i=>state.checked[i.id]).length}/${total.length}</span></div>${group.map(item=>`<label class="check-item${state.checked[item.id]?' done':''}" for="check-${item.id}"><input id="check-${item.id}" type="checkbox" data-check="${item.id}"${state.checked[item.id]?' checked':''}><span><strong>${escape(item.title)}</strong><p>${escape(item.detail)}</p></span></label>`).join('')}</section>` : '';}).join('') || `<div class="panel empty-state"><h3>Every item is checked.</h3><p>Turn off “Only show what’s left” to review or change an item.</p><button class="text-button" type="button" data-action="show-all">Show the full checklist →</button></div>`}</div><aside class="checklist-aside"><section class="check-progress"><p class="eyebrow">ONE STEP AT A TIME</p><h3>${complete}<span> / ${items.length} arranged</span></h3><div class="meter" role="progressbar" aria-label="Checklist items arranged" aria-valuenow="${complete}" aria-valuemin="0" aria-valuemax="${items.length}"><span style="width:${complete/items.length*100}%"></span></div><p>${complete===items.length?'Checklist complete. Review it with your household and test the equipment you plan to use.':'Progress is saved in this browser. Come back to the next step whenever you can.'}</p><button class="button button-amber button-full" type="button" data-action="save">${icon('download')}Keep a copy</button></section><section class="panel contact-panel"><h3>Your people, on paper.</h3><p class="helper">Add only what you want in your saved plan.</p><label class="field" for="contact"><span class="field-label">Check-in person & number</span><input id="contact" data-field="contact" class="text-input" type="text" maxlength="240" value="${escape(state.contact)}" placeholder="Name · phone number" autocomplete="off"></label><label class="field" for="meeting"><span class="field-label">Safe place to meet or stay</span><textarea id="meeting" data-field="meeting" rows="2" maxlength="300" placeholder="Place, address, and how to get there">${escape(state.meeting)}</textarea></label><label class="field" for="notes"><span class="field-label">Notes for your household</span><textarea id="notes" data-field="notes" rows="3" maxlength="3000" placeholder="Building contact, transport, supplies…">${escape(state.notes)}</textarea></label><p class="helper">${icon('lock')} Stored on this device. Included when you export.</p></section>${foodCard()}</aside></div></section>`;
  }
  function preserveFocus(work) {
    const active=document.activeElement, id=active?.id;
    let start=null,end=null;
    try { start=active?.selectionStart;end=active?.selectionEnd; } catch (_) {}
    work();
    if (id) {
      const next=document.getElementById(id);
      if(next){if(next.disabled && next.dataset.step)document.getElementById(next.dataset.step.split(':')[0])?.focus({preventScroll:true});else next.focus({preventScroll:true});if(typeof start==='number')try{next.setSelectionRange(start,end);}catch(_){}}
    }
  }
  function render() {
    preserveFocus(()=> { $('#app').innerHTML=view==='overview'?renderOverview():view==='power'?renderPower():renderChecklist(); });
    $$('.view-button').forEach(button=>{const selected=button.dataset.view===view;button.classList.toggle('active',selected);if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
    updateNavCount();updateSaveStatus();fillIcons();
  }
  function updateNavCount() { const items=M.checklist(state);$('#nav-check-count').textContent=`${items.filter(i=>state.checked[i.id]).length}/${items.length}`; }
  function refreshResults() {
    if(view==='overview'){$('#overview-results').innerHTML=overviewResults();if($('#mobile-summary'))$('#mobile-summary').innerHTML=mobileSummary();}
    if(view==='power'){
      $('#power-results').innerHTML=powerResults();
      $('#device-total').textContent=fmt(M.calculate(state).loadWhDay,0)+' Wh/day';
      $$('[data-device-wh]').forEach(el=>{const d=state.devices.find(d=>d.id===el.dataset.deviceWh);el.textContent=d.enabled?fmt(M.deviceWh(d),0)+' Wh/day':'Not in this plan';});
      if($('#charge-display'))$('#charge-display').textContent=state.charge+'%';
      $$('.capacity-chip').forEach(b=>b.classList.toggle('selected',Number(b.dataset.capacity)===state.batteryWh));
    }
    updateNavCount();
    clearTimeout(announceTimer);
    announceTimer=setTimeout(()=>{const c=M.calculate(state);$('#live-summary').textContent=`Battery: ${duration(c.runtimeHours)}. Water: ${fmt(state.water)} of ${fmt(c.waterTarget)} gallons.`;},650);
  }
  function goTo(next) {
    if(!['overview','power','checklist'].includes(next))return;
    view=next;try{history.replaceState(null,'','#'+next);}catch(_){}
    render();$('.view-nav').scrollIntoView({behavior:'auto',block:'start'});
    $(`[data-view="${next}"]`)?.focus({preventScroll:true});
  }
  function toast(message,undo) {
    clearTimeout(toastTimer);const el=$('#toast');el.replaceChildren();el.append(document.createTextNode(message));
    if(undo){const b=document.createElement('button');b.textContent='Undo';b.type='button';b.onclick=()=>{undo();el.classList.remove('visible');};el.append(b);}
    el.classList.add('visible');toastTimer=setTimeout(()=>el.classList.remove('visible'),undo?10000:5000);
  }
  function openModal(title,kicker,content) {
    const modal=$('#modal');modalReturn=document.activeElement;
    $('#modal-title').textContent=title;$('#modal-kicker').textContent=kicker;$('#modal-content').innerHTML=content;
    fillIcons(modal);if(!modal.open)modal.showModal();modal.scrollTop=0;
  }
  function closeModal(){const el=$('#modal');if(el.open)el.close();}
  function saveModal() {
    openModal('A plan you can keep.','SAVE IT BEFORE YOU NEED IT',`<p class="dialog-copy">Your household details, checklist, and notes are included. Keep a copy somewhere you can reach without power or internet.</p><div class="save-options"><button class="save-option featured" type="button" data-action="print"><span class="option-icon">${icon('print')}</span><span><strong>Print or save as PDF</strong><small>A clear, practical plan for your household.</small></span>${icon('arrow')}</button><button class="save-option" type="button" data-action="offline-download"><span class="option-icon">${icon('offline')}</span><span><strong>Download the offline app</strong><small>One HTML file, with this plan inside. Open in a desktop browser; no installation needed.</small></span>${icon('arrow')}</button><button class="save-option" type="button" data-action="export"><span class="option-icon">${icon('file')}</span><span><strong>Export an editable plan</strong><small>A small JSON file to import into Afterlight on another device.</small></span>${icon('arrow')}</button></div><div class="save-links"><button class="text-button" type="button" data-action="import">${icon('upload')}Import a plan</button><button class="text-button" type="button" data-action="reset">${icon('reset')}Start over</button></div><p class="offline-status">${window.AFTERLIGHT_PORTABLE ? 'You are using the portable app. Keep this file to reopen it later.' : appOfflineReady ? 'This browser has cached the app for offline use. Downloading a file is a more durable backup.' : 'Download a copy before you lose connectivity. Source links need an internet connection.'} On iPhone, use Print or save as PDF for a dependable offline reference.</p>`);
  }
  function methodModal() {
    const c=M.calculate(state);
    openModal('Numbers you can inspect.','HOW THE ESTIMATE WORKS',`<div class="dialog-copy"><p>This is an energy-budget estimate for a portable battery. It does not simulate exactly when each device starts or stops.</p><h3>Daily energy use</h3><div class="formula">Device Wh/day = watts × hours/day × quantity<br>Battery Wh/day = total device Wh/day ÷ efficiency + idle watts × 24</div><h3>Energy available & runtime</h3><div class="formula">Available Wh = rated Wh × max(0, charge % − reserve %) ÷ 100<br>Runtime hours = available Wh ÷ battery Wh/day × 24</div><table class="formula-table"><tbody><tr><th>Available stored energy</th><td>${fmt(c.usableStoredWh)} Wh</td></tr><tr><th>Conversion efficiency</th><td>${state.efficiency}%</td></tr><tr><th>Daily device energy</th><td>${fmt(c.loadWhDay)} Wh</td></tr><tr><th>Daily idle energy</th><td>${fmt(c.idleWhDay)} Wh</td></tr><tr><th>Total daily battery draw</th><td>${fmt(c.batteryWhDay)} Wh</td></tr></tbody></table><p>Reserve is a percentage of rated battery capacity. Losses and idle draw are editable assumptions, not a guarantee from a manufacturer. Idle draw applies only when at least one included device has nonzero watts and daily use.</p><h3>What can change the result</h3><p>Battery age, temperature, actual power draw, appliance cycling, standby use, and when devices run. The chart spreads daily energy evenly through time, so its reserve time is not a precise outage countdown. No recharging is included.</p><p>A refrigerator preset uses illustrative running power and total compressor-on hours. Check its real energy consumption and starting surge. A powered router may still have no internet connection.</p><h3>Power is different from energy</h3><p>The output check adds the running watts of all included devices as if they run at once. Starting surges, plug type, voltage, and battery limits need a separate check. This tool does not verify electrical compatibility or medical backup requirements.</p><h3>Water</h3><div class="formula">Gallons needed = (people + extra gallons/day) × days<br>Supply hours = stored gallons ÷ daily gallons × 24</div><p>The baseline is one US gallon per person per day. Add extra for individual needs, pets, or heat. A one-day scenario does not replace the CDC’s advice to store at least a three-day supply, with two weeks if possible. <a href="${sources.water.url}" target="_blank" rel="noopener noreferrer">Read the CDC guidance.</a></p></div>`);
  }
  function sourcesModal() {
    openModal('Good guidance, close at hand.','SOURCES · REVIEWED SEPTEMBER 5, 2026',`<div class="dialog-copy"><p>Afterlight is an independent planning tool. Follow instructions from your local authorities and your equipment manufacturer. Links open the original guidance.</p></div><div class="source-list">${Object.values(sources).map(s=>`<div class="source-row"><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a><p>${s.detail}</p></div>`).join('')}</div><div class="dialog-copy"><h3>About the example</h3><p>The starter household, battery specifications, and device wattages are illustrative inputs. They are not product recommendations, measurements, or an official readiness standard.</p></div>`);
  }
  function privacyModal() {
    openModal('Your plan stays with you.','PRIVACY',`<div class="dialog-copy"><p>The app stores your inputs, checklist, and notes in this browser’s local storage. It has no analytics, ads, or app database, and does not send your plan inputs to a server.</p><p>The hosting service may handle normal web requests and access controls. Opening a source link takes you to another website. Downloaded or printed plans include the details you entered, so share them thoughtfully.</p><p>Browser storage can be cleared, may not work in every private browsing mode, and is visible to others using this browser profile. Export a file if you need a durable copy.</p><p>Use <strong>Save your plan → Start over</strong> to clear this browser’s current plan. Other browser profiles and downloaded files are separate copies.</p></div>`);
  }
  function foodModal() {
    openModal('Time matters. Temperature does too.','FOOD DURING AN OUTAGE',`<div class="dialog-copy"><p>Keep refrigerator and freezer doors closed. An unopened fridge usually holds cold for about 4 hours; a full freezer for about 48 hours, or 24 hours if half full.</p><h3>Use a thermometer</h3><p>Keep refrigerated food at or below 40°F / 4°C. If possible, transfer perishables to an iced cooler that keeps them at that temperature before they warm up.</p><p>Discard perishable food that has been above 40°F for 2 hours or more, or 1 hour when the surrounding temperature is above 90°F / 32°C. If you do not know how warm it became or for how long, discard it.</p><p>Frozen food can generally be refrozen if it still has ice crystals or is at 40°F or below. Never taste food to decide whether it is safe.</p><p>These rules apply to food. Ask a pharmacist or care team about refrigerated medication.</p><p><a href="${sources.food.url}" target="_blank" rel="noopener noreferrer">Read the FDA’s full guidance ↗</a></p></div>`);
  }
  function addDeviceModal() {
    if(state.devices.length>=40){toast('This plan can contain up to 40 devices.');return;}
    openModal('One more thing to keep running.','ADD A DEVICE',`<form id="add-device-form"><p class="dialog-copy">Use running watts from the device label or a measured average. For cycling equipment, enter total active hours in a day.</p><label class="field" for="new-name"><span class="field-label">Device name</span><input class="text-input" id="new-name" name="name" maxlength="70" required placeholder="e.g. Desk light" autocomplete="off"></label><div class="field-pair"><label class="field" for="new-watts"><span class="field-label">Running watts</span><input class="number-input" id="new-watts" name="watts" type="number" min="0" max="10000" step="0.1" value="10" required inputmode="decimal"></label><label class="field" for="new-hours"><span class="field-label">Hours per day</span><input class="number-input" id="new-hours" name="hours" type="number" min="0" max="24" step="0.1" value="2" required inputmode="decimal"></label></div><label class="check-label"><input name="essential" type="checkbox"><span>Keep this device in my essentials plan</span></label><p class="helper" style="margin-top:15px">This estimate does not check starting surge or validate support for medical devices.</p><div class="form-actions"><button class="button button-white" type="button" data-action="close">Cancel</button><button class="button button-blue" type="submit">${icon('plus')}Add to my plan</button></div></form>`);
    $('#new-name').focus();
  }
  function downloadBlob(blob,filename) {
    const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  function dateStamp(){return new Date().toISOString().slice(0,10);}
  function exportPlan(){downloadBlob(new Blob([JSON.stringify(state,null,2)+'\n'],{type:'application/json'}),`afterlight-plan-${dateStamp()}.json`);toast('Your editable plan has been downloaded.');}
  async function downloadOffline() {
    const button=$('[data-action="offline-download"]');if(button)button.disabled=true;
    try {
      let template;
      if(window.AFTERLIGHT_PORTABLE)template='<!doctype html>\n'+document.documentElement.outerHTML;
      else {
        const response=await fetch('afterlight-offline.html',{credentials:'same-origin'});
        if(!response.ok)throw new Error('The offline copy could not be downloaded.');
        template=await response.text();
        if(!template.includes('AFTERLIGHT_PORTABLE'))throw new Error('The offline copy is unavailable.');
      }
      const doc=new DOMParser().parseFromString(template,'text/html');
      doc.querySelector('#afterlight-seed')?.remove();
      const embed=doc.createElement('script');embed.id='afterlight-seed';embed.type='application/json';embed.textContent=JSON.stringify({id:'copy-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),plan:state}).replace(/</g,'\\u003c');
      // Keep the charset declaration at the start of the file, including when
      // the embedded plan contains long notes or non-ASCII names.
      doc.head.append(embed);
      for(const id of ['app','modal-content','print-root','toast','live-summary']){const el=doc.getElementById(id);if(el)el.replaceChildren();}
      doc.querySelector('#modal')?.removeAttribute('open');doc.querySelector('#toast')?.classList.remove('visible');
      downloadBlob(new Blob(['<!doctype html>\n'+doc.documentElement.outerHTML],{type:'text/html;charset=utf-8'}),`afterlight-offline-${dateStamp()}.html`);
      toast('Offline app downloaded. Open the HTML file in a desktop browser.');
    } catch(error) { toast(error.message+' You can still export your plan or print it.'); }
    finally { if(button)button.disabled=false; }
  }
  function importPlan() {
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
    input.onchange=async()=>{
      const file=input.files?.[0];if(!file)return;
      if(file.size>1024*1024){toast('Choose an Afterlight JSON plan smaller than 1 MB.');return;}
      try {
        const next=M.sanitize(JSON.parse(await file.text()));
        openModal('Bring this plan onto this device?','IMPORT PLAN',`<div class="dialog-copy"><p><strong>${escape(file.name)}</strong></p><p>${next.people} ${next.people===1?'person':'people'} · ${next.days} days · ${fmt(next.water)} gallons · ${fmt(next.batteryWh,0)} Wh battery</p><p>This replaces the plan in this browser. Export your current plan first if you want to keep both.</p></div><div class="form-actions"><button class="button button-white" type="button" data-action="export">Export current plan</button><button class="button button-blue" type="button" id="confirm-import">Import this plan</button></div>`);
        $('#confirm-import').onclick=()=>{state=next;persist(false);loadIssue='';closeModal();render();toast('Your plan is ready on this device.');};
      }catch(error){toast(error instanceof SyntaxError?'That file is not valid JSON. Choose an exported Afterlight plan.':error.message);}
    };
    input.click();
  }
  function resetModal() {
    openModal('Start a fresh plan?','CLEAR THIS BROWSER’S PLAN',`<div class="dialog-copy"><p>This clears the current inputs, notes, and checkmarks in this browser, then opens the example again. Downloaded copies are kept separately.</p><p>Export your plan first if you want to save your progress.</p></div><div class="form-actions"><button class="button button-white" type="button" data-action="export">Export first</button><button class="button button-dark" type="button" id="confirm-reset">Clear & start over</button></div>`);
    $('#confirm-reset').onclick=()=>{state=M.defaults();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageAvailable=true;}catch(_){storageAvailable=false;}saved=false;checklistFilter='all';undoDevices=null;loadIssue='';closeModal();render();toast('A fresh example plan is ready.');};
  }
  function renderPrint() {
    const c=M.calculate(state), e=M.calculate(state,true), checks=M.checklist(state), done=checks.filter(i=>state.checked[i.id]).length;
    const flags=Object.entries(state.needs).filter(([,v])=>v).map(([k])=>({pets:'Pets',medical:'Power-dependent care',medicine:'Refrigerated medicine',mobility:'Mobility support'}[k]));
    $('#print-root').innerHTML=`<div class="print-header"><div><h1>afterlight.</h1><p>Your household’s power outage plan</p></div><div class="print-subtle"><p>Saved ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p><p>${state.example?'EXAMPLE INPUTS · personalize before relying on this plan':'Based on the inputs you entered'}</p></div></div><p><strong>${state.people} ${state.people===1?'person':'people'} · ${state.days} days · ${escape(state.home)}</strong>${flags.length?' · '+flags.map(escape).join(', '):''}</p><div class="print-grid"><div class="print-stat"><strong>${runtimeValue(c.runtimeHours)} hours</strong><span>Estimated battery runtime / ${c.targetHours}-hour target</span></div><div class="print-stat"><strong>${fmt(state.water)} / ${fmt(c.waterTarget)} gal</strong><span>Stored water / planned baseline</span></div><div class="print-stat"><strong>${done} / ${checks.length}</strong><span>Checklist items arranged</span></div></div><div class="print-callout"><strong>Put people first.</strong> Follow local emergency instructions. Leave for a safer place when heat, cold, or medical needs make home unsafe. For immediate danger in the U.S., call 911.${state.needs.medical?' Arrange power-dependent care with your care team and equipment supplier. This estimate cannot validate medical backup.':''}</div><h2>Close these gaps</h2><ul>${c.waterGap>0?`<li>Add ${fmt(c.waterGap)} US gallons of water to reach this plan’s baseline.</li>`:'<li>Your entered water amount covers the planned baseline. Include extra for heat, pets, and individual needs.</li>'}${c.outputExceeded?`<li>Selected running loads total ${fmt(c.simultaneousW,0)} W, above the ${fmt(state.maxOutputW,0)} W output limit. Reduce simultaneous use and verify starting surge.</li>`:''}${!c.hasLoad?'<li>Select actual devices to estimate your battery needs.</li>':c.coversPower?'<li>Entered battery energy covers the duration target under the stated assumptions. Test the setup.</li>':`<li>Battery energy is below the duration target. Arrange less use or a verified way to recharge; estimated stored-energy gap: ${fmt(c.shortageWh,0)} Wh.</li>`}${state.needs.pets&&state.extraWater===0?'<li>Pets are included, but extra water is zero. Add their water needs.</li>':''}</ul><h2>Battery & devices</h2><p class="print-subtle">${fmt(state.batteryWh,0)} Wh rated · ${state.charge}% starting charge · ${state.reserve}% reserve · ${state.efficiency}% conversion efficiency · ${state.idleW} W idle draw · ${state.maxOutputW?fmt(state.maxOutputW,0)+' W output limit':'output limit unknown'}</p><table><thead><tr><th>Included device</th><th>Watts</th><th>Hours/day</th><th>Qty</th><th>Wh/day</th><th>Essential</th></tr></thead><tbody>${c.active.map(d=>`<tr><td>${escape(d.name)}</td><td>${fmt(d.watts)}</td><td>${fmt(d.hours)}</td><td>${d.quantity}</td><td>${fmt(M.deviceWh(d))}</td><td>${d.essential?'Yes':'—'}</td></tr>`).join('')||'<tr><td colspan="6">No active devices selected.</td></tr>'}</tbody></table><p class="print-subtle">${fmt(c.usableStoredWh)} Wh usable stored energy · ${fmt(c.loadWhDay)} Wh/day to devices · ${fmt(c.batteryWhDay)} Wh/day battery draw including losses and idle. ${e.hasLoad?'Essentials-only estimate: '+duration(e.runtimeHours)+'.':''}</p><p class="print-subtle">Available Wh = rated Wh × max(0, charge − reserve)/100. Daily battery draw = device Wh/day ÷ efficiency + idle W × 24. Runtime = available Wh ÷ daily draw × 24. Daily use is averaged evenly, with no recharging. Actual performance varies; check starting surge and equipment compatibility.</p><h2>Your people & destination</h2><p><strong>Check-in person:</strong> ${escape(state.contact)||'____________________________________________'}</p><p><strong>Safe place & transport:</strong> ${escape(state.meeting)||'________________________________________'}</p>${state.notes?`<p class="print-notes">${escape(state.notes)}</p>`:''}<div class="print-page-break"></div><h2>Your checklist</h2>${[['supplies','Supplies'],['before','Before an outage'],['people','People & arrangements']].map(([key,title])=>`<h3>${title}</h3>${checks.filter(i=>i.group===key).map(i=>`<div class="print-check"><i>${state.checked[i.id]?'✓':''}</i><div><strong>${escape(i.title)}</strong><p>${escape(i.detail)}</p></div></div>`).join('')}`).join('')}<h2>Keep these safety basics handy</h2><div class="print-callout"><p><strong>Food:</strong> Closed doors: about 4 hours for a fridge, 48 hours for a full freezer, 24 hours for a half-full freezer. Keep perishables at or below 40°F / 4°C. Discard perishables above 40°F for 2 hours, or 1 hour above 90°F ambient. Never taste to test. Medication has its own storage requirements.</p><p><strong>Generators:</strong> Outdoors only, at least 20 feet from doors, windows, and vents. Never use fuel-powered equipment in a home, basement, or garage. Use battery-backed carbon monoxide alarms.</p><p><strong>Water:</strong> The baseline is 1 US gallon per person/day plus ${fmt(state.extraWater)} extra gallons/day. CDC recommends at least a 3-day supply, with 2 weeks if possible. Individual needs can be higher.</p></div><h3>Guidance to consult</h3><div class="print-sources">${['water','food','co','outage',...(state.needs.medical?['medical']:[])].map(k=>`<p>${sources[k].title}: <a href="${sources[k].url}">${sources[k].url}</a></p>`).join('')}</div><div class="print-footer">Afterlight · Built by Thomas Verdier · Independent planning tool · Guidance reviewed September 5, 2026. Calculations and checkmarks do not certify emergency readiness.</div>`;
  }
  function printPlan(){renderPrint();closeModal();requestAnimationFrame(()=>window.print());}
  function applyEssentials() {
    const e=M.calculate(state,true);if(!e.hasLoad){toast('Star at least one included device first.');return;}
    undoDevices=state.devices.map(d=>({id:d.id,enabled:d.enabled}));
    state.devices.forEach(d=>{if(!d.essential)d.enabled=false;});persist();render();$('#devices-title')?.focus({preventScroll:true});
    toast('Optional devices switched off. Keep needed cooling and care included.',()=>{if(undoDevices){for(const prior of undoDevices){const d=state.devices.find(d=>d.id===prior.id);if(d)d.enabled=prior.enabled;}undoDevices=null;persist();render();}});
  }
  function dispatch(action) {
    if(action==='save')saveModal();
    else if(action==='method')methodModal();
    else if(action==='sources')sourcesModal();
    else if(action==='food')foodModal();
    else if(action==='add-device')addDeviceModal();
    else if(action==='close')closeModal();
    else if(action==='print')printPlan();
    else if(action==='export')exportPlan();
    else if(action==='offline-download')downloadOffline();
    else if(action==='import')importPlan();
    else if(action==='reset')resetModal();
    else if(action==='essentials')applyEssentials();
    else if(action==='show-all'){checklistFilter='all';render();}
    else if(action==='water-focus'){if(view!=='overview')goTo('overview');$('#water')?.focus();$('#water')?.select();}
    else if(action==='extra-water-focus'){if(view!=='overview')goTo('overview');$('.extra-water-field').open=true;$('#extraWater')?.focus();$('#extraWater')?.select();}
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button || button.disabled)return;
    if(button.dataset.view)goTo(button.dataset.view);
    else if(button.dataset.goto)goTo(button.dataset.goto);
    else if(button.dataset.action)dispatch(button.dataset.action);
    else if(button.dataset.step){const [key,delta]=button.dataset.step.split(':');const [min,max]=M.LIMITS[key];state[key]=Math.min(max,Math.max(min,state[key]+Number(delta)));persist();render();}
    else if(button.dataset.capacity){state.batteryWh=Number(button.dataset.capacity);persist();render();}
    else if(button.dataset.essential){const d=state.devices.find(d=>d.id===button.dataset.essential);if(d){d.essential=!d.essential;persist();render();}}
    else if(button.dataset.remove){const id=button.dataset.remove,index=state.devices.findIndex(d=>d.id===id),d=state.devices[index];if(!d)return;state.devices.splice(index,1);persist();render();toast('Device removed.',()=>{if(!state.devices.some(v=>v.id===id)){state.devices.splice(Math.min(index,state.devices.length),0,d);persist();render();}});}
  });
  function handleInput(event) {
    const el=event.target;
    if(el.dataset.field && !['select-one','checkbox'].includes(el.type)){
      const key=el.dataset.field;
      if(['notes','contact','meeting'].includes(key)){state[key]=el.value;persist();return;}
      if(el.value==='' || !el.validity.valid)return;
      let value=Number(el.value);if(!Number.isFinite(value))return;
      if(['people','days'].includes(key))value=Math.round(value);
      state[key]=value;persist();refreshResults();
    }
    else if(el.dataset.device && el.type==='number'){
      if(el.value==='' || !el.validity.valid)return;
      const d=state.devices.find(d=>d.id===el.dataset.device);if(!d)return;
      d[el.dataset.prop]=Number(el.value);persist();refreshResults();
    }
  }
  document.addEventListener('input',handleInput);
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.dataset.need){state.needs[el.dataset.need]=el.checked;persist();render();}
    else if(el.dataset.check){state.checked[el.dataset.check]=el.checked;persist();render();if(checklistFilter==='remaining')$('#remaining-only')?.focus({preventScroll:true});}
    else if(el.dataset.filter){checklistFilter=el.checked?'remaining':'all';render();}
    else if(el.dataset.field==='home'){state.home=el.value;persist();render();}
    else if(el.dataset.device && el.type==='checkbox'){const d=state.devices.find(d=>d.id===el.dataset.device);if(d){d.enabled=el.checked;persist();render();}}
    else if(el.type==='number' && (el.dataset.field||el.dataset.device)){
      if(el.value==='' || !el.validity.valid){const key=el.dataset.field||el.dataset.prop;const prior=el.dataset.device?state.devices.find(d=>d.id===el.dataset.device)?.[key]:state[key];el.value=prior;toast(`Use a value from ${el.min} to ${el.max}${el.step&&el.step!=='any'?' in steps of '+el.step:''}.`);}
      if(el.dataset.field && ['people','days'].includes(el.dataset.field))render();
    }
  });
  document.addEventListener('submit',event=>{
    if(event.target.id!=='add-device-form')return;event.preventDefault();const form=event.target;if(!form.reportValidity())return;
    const data=new FormData(form),name=String(data.get('name')||'').trim();if(!name){$('#new-name').setCustomValidity('Enter a device name.');$('#new-name').reportValidity();$('#new-name').oninput=()=>$('#new-name').setCustomValidity('');return;}
    state.devices.push({id:'custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),name,category:'custom',watts:Number(data.get('watts')),hours:Number(data.get('hours')),quantity:1,essential:data.has('essential'),enabled:true,icon:'plug',note:'User-entered device. Verify real power draw and starting surge.'});persist();closeModal();render();document.getElementById('include-'+state.devices[state.devices.length-1].id)?.focus({preventScroll:true});toast(name+' added to your plan.');
  });
  $('#save-open').onclick=saveModal;$('#sources-open').onclick=sourcesModal;$('#privacy-open').onclick=privacyModal;$('#method-open').onclick=methodModal;$('#modal-close').onclick=closeModal;
  $('#modal').addEventListener('close',()=>{modalReturn?.isConnected && modalReturn.focus({preventScroll:true});});
  $('#modal').addEventListener('click',event=>{if(event.target===$('#modal')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}});
  window.addEventListener('beforeprint',renderPrint);
  window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(['overview','power','checklist'].includes(next)){view=next;render();}});
  if('serviceWorker' in navigator && location.protocol==='https:' && !window.AFTERLIGHT_PORTABLE){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{appOfflineReady=true;}).catch(()=>{});});}
  render();
})();
