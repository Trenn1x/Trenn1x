(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.AfterlightModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const LIMITS = {
    people: [1, 20], days: [1, 14], water: [0, 10000], extraWater: [0, 100],
    batteryWh: [0, 100000], charge: [0, 100], reserve: [0, 50], efficiency: [50, 100],
    idleW: [0, 100], maxOutputW: [0, 20000], watts: [0, 10000], hours: [0, 24], quantity: [1, 20]
  };
  const catalog = [
    {id: 'phone', name: 'Phone charging', category: 'communication', watts: 10, hours: 2, quantity: 2, essential: true, enabled: true, icon: 'phone', note: 'Example charging draw. Includes two phones; edit the quantity.'},
    {id: 'light', name: 'LED lantern', category: 'lighting', watts: 5, hours: 6, quantity: 1, essential: true, enabled: true, icon: 'light', note: 'Example low-power LED light.'},
    {id: 'fan', name: 'Small fan', category: 'comfort', watts: 25, hours: 8, quantity: 1, essential: false, enabled: true, icon: 'fan', note: 'Example small fan. A fan cannot make unsafe heat safe.'},
    {id: 'laptop', name: 'Laptop', category: 'work', watts: 45, hours: 3, quantity: 1, essential: false, enabled: true, icon: 'laptop', note: 'Example average while in use; the charger label may be higher.'},
    {id: 'router', name: 'Router + modem', category: 'communication', watts: 15, hours: 6, quantity: 1, essential: false, enabled: false, icon: 'wifi', note: 'Powering equipment does not guarantee internet service.'},
    {id: 'fridge', name: 'Refrigerator', category: 'food', watts: 150, hours: 8, quantity: 1, essential: false, enabled: false, icon: 'fridge', note: 'Illustrative cycling load: 150 W for 8 total hours/day. Starting surge is not modeled.'}
  ];
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function defaults() {
    return {version: VERSION, example: true, people: 2, days: 3, water: 4, extraWater: 0,
      batteryWh: 1000, charge: 100, reserve: 10, efficiency: 85, idleW: 5, maxOutputW: 1000,
      home: 'apartment', needs: {pets: false, medical: false, medicine: false, mobility: false},
      devices: clone(catalog), checked: {}, notes: '', contact: '', meeting: '', updatedAt: null};
  }
  function bound(value, key, fallback) {
    const n = Number(value);
    const [min, max] = LIMITS[key];
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  }
  function cleanText(value, length) { return typeof value === 'string' ? value.slice(0, length) : ''; }
  function sanitize(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('This file does not contain an Afterlight plan.');
    if (raw.version !== VERSION) throw new Error('This plan uses an unsupported version.');
    const d = defaults();
    for (const key of ['people','days','water','extraWater','batteryWh','charge','reserve','efficiency','idleW','maxOutputW']) d[key] = bound(raw[key], key, d[key]);
    d.people = Math.round(d.people); d.days = Math.round(d.days);
    d.example = raw.example === true;
    d.home = ['apartment','house','other'].includes(raw.home) ? raw.home : 'apartment';
    for (const key of Object.keys(d.needs)) d.needs[key] = raw.needs?.[key] === true;
    if (Array.isArray(raw.devices)) {
      const seen = new Set();
      d.devices = raw.devices.slice(0, 40).filter(v => v && typeof v === 'object').map((v, i) => {
        let id = cleanText(v.id, 60).replace(/[^a-zA-Z0-9_-]/g, '') || 'custom-' + i;
        const baseId = id;
        let suffix = 1;
        while (seen.has(id)) id = baseId + '-' + suffix++;
        seen.add(id);
        return {id, name: cleanText(v.name, 70).trim() || 'Unnamed device',
          category: cleanText(v.category, 30) || 'custom', watts: bound(v.watts, 'watts', 10),
          hours: bound(v.hours, 'hours', 1), quantity: Math.round(bound(v.quantity, 'quantity', 1)),
          essential: v.essential === true, enabled: v.enabled === true,
          icon: ['phone','light','fan','laptop','wifi','fridge'].includes(v.icon) ? v.icon : 'plug',
          note: cleanText(v.note, 240)};
      });
    }
    d.checked = {};
    if (raw.checked && typeof raw.checked === 'object') {
      Object.keys(raw.checked).slice(0, 100).forEach(k => {
        if (/^[a-z0-9-]{1,60}$/.test(k)) d.checked[k] = raw.checked[k] === true;
      });
    }
    d.notes = cleanText(raw.notes, 3000);
    d.contact = cleanText(raw.contact, 240);
    d.meeting = cleanText(raw.meeting, 300);
    d.updatedAt = typeof raw.updatedAt === 'string' && !Number.isNaN(Date.parse(raw.updatedAt)) ? raw.updatedAt : null;
    return d;
  }
  function deviceWh(device) { return device.enabled ? device.watts * device.hours * device.quantity : 0; }
  function calculate(plan, essentialOnly = false) {
    const active = plan.devices.filter(d => d.enabled && (!essentialOnly || d.essential) && d.hours > 0 && d.watts > 0);
    const loadWhDay = active.reduce((sum, d) => sum + deviceWh(d), 0);
    const efficiency = plan.efficiency / 100;
    const usableStoredWh = plan.batteryWh * Math.max(0, plan.charge - plan.reserve) / 100;
    const idleWhDay = active.length ? plan.idleW * 24 : 0;
    const batteryWhDay = loadWhDay / efficiency + idleWhDay;
    const hasLoad = batteryWhDay > 0;
    const runtimeHours = hasLoad ? 24 * usableStoredWh / batteryWhDay : null;
    const targetHours = plan.days * 24;
    const targetStoredWh = batteryWhDay * plan.days;
    const energyGap = Math.max(0, targetStoredWh - usableStoredWh);
    const shortageWh = energyGap < 1e-9 ? 0 : energyGap;
    const simultaneousW = active.reduce((sum, d) => sum + d.watts * d.quantity, 0);
    const outputExceeded = plan.maxOutputW > 0 && simultaneousW > plan.maxOutputW;
    const waterPerDay = plan.people + plan.extraWater;
    const waterTarget = waterPerDay * plan.days;
    const waterHours = plan.water / waterPerDay * 24;
    const rawWaterGap = Math.max(0, waterTarget - plan.water);
    const waterGap = rawWaterGap < 1e-9 ? 0 : rawWaterGap;
    const fraction = Math.max(0, plan.charge - plan.reserve) / 100;
    const requiredCapacityWh = fraction > 0 ? targetStoredWh / fraction : null;
    return {active, loadWhDay, idleWhDay, batteryWhDay, usableStoredWh, hasLoad, runtimeHours,
      targetHours, targetStoredWh, shortageWh, simultaneousW, outputExceeded, waterPerDay,
      waterTarget, waterHours, waterGap, requiredCapacityWh,
      coversPower: hasLoad && !outputExceeded && shortageWh === 0,
      coversWater: waterGap === 0};
  }
  function remainingAt(plan, hours, essentialOnly = false) {
    const c = calculate(plan, essentialOnly);
    return Math.max(0, c.usableStoredWh - c.batteryWhDay * Math.max(0, hours) / 24);
  }
  function checklist(plan) {
    const items = [
      {id:'water', group:'supplies', title:'Store water for everyone', detail:`Your planned total is ${format((plan.people + plan.extraWater) * plan.days)} US gallons over ${plan.days} days: ${format(plan.people * plan.days)} for people plus ${format(plan.extraWater * plan.days)} extra. Individual needs may be higher.`, source:'water'},
      {id:'food', group:'supplies', title:'Set aside food you can eat without power', detail:`Plan ${plan.days} days of shelf-stable food for ${plan.people} ${plan.people === 1 ? 'person' : 'people'}, including dietary needs and a manual can opener.`, source:'kit'},
      {id:'light', group:'supplies', title:'Put flashlights and spare batteries together', detail:'Use battery lighting. Keep one light within reach in the dark.', source:'outage'},
      {id:'first-aid', group:'supplies', title:'Check first aid and everyday essentials', detail:'Include hygiene supplies, glasses, hearing-aid batteries, and personal necessities.', source:'kit'},
      {id:'charge', group:'before', title:'Charge batteries and test the actual setup', detail:'Try the cables and outlets you will use. Check continuous power, starting surge, and manufacturer instructions.', source:'outage'},
      {id:'alerts', group:'before', title:'Keep a way to receive local instructions', detail:'Set up local emergency alerts and keep a battery or hand-crank radio available.', source:'outage'},
      {id:'cold', group:'before', title:'Prepare a cooler and appliance thermometer', detail:'Keep the refrigerator at 40°F / 4°C or below before an outage. Have ice or frozen gel packs ready.', source:'food'},
      {id:'co', group:'before', title:'Test smoke and carbon monoxide alarms', detail:'Use battery backup. Fuel-powered generators belong outdoors, at least 20 feet from doors, windows, and vents.', source:'co'},
      {id:'contact', group:'people', title:'Choose a check-in person and meeting place', detail:'Write down a contact, a safe place to go, and how everyone will get there.', source:'outage'},
      {id:'neighbor', group:'people', title:'Make a check-in plan with a neighbor', detail:'Arrange who will check on whom, especially anyone living alone or needing help.', source:'outage'},
      {id:'offline', group:'people', title:'Keep a copy you can use without internet', detail:'Save this plan and the offline app, or print a paper copy. Keep emergency numbers with it.', source:'kit'}
    ];
    if (plan.home === 'apartment') items.push({id:'building',group:'people',title:'Confirm the building’s outage arrangements',detail:'Ask about stair access, emergency lighting, water pumps, and how to contact management.',source:'outage'});
    if (plan.needs.pets) items.push({id:'pets',group:'supplies',title:'Pack your pets’ food, water, and carriers',detail:'Add their daily water needs under Extra water. Arrange a destination that can accommodate them.',source:'pets'});
    if (plan.needs.medical) items.push({id:'medical',group:'people',title:'Arrange a backup for power-dependent care',detail:'Plan with the care team and equipment supplier before an outage, including backup duration, a safe destination, and transport. This calculator cannot validate a medical backup.',source:'medical'});
    if (plan.needs.medicine) items.push({id:'medicine',group:'before',title:'Confirm storage instructions for your medicine',detail:'Ask a pharmacist or care team about temperature limits, backup cooling, and replacement. Food-storage timelines do not apply to medication.',source:'medical'});
    if (plan.needs.mobility) items.push({id:'mobility',group:'people',title:'Arrange accessible transport and a place to go',detail:'Include stairs, powered mobility equipment, a support person, and a destination with the access you need.',source:'disability'});
    return items;
  }
  function format(n, places = 1) { return Number(n.toFixed(places)).toLocaleString('en-US', {maximumFractionDigits: places}); }
  return {VERSION, LIMITS, catalog, defaults, sanitize, calculate, remainingAt, checklist, deviceWh, format};
});
