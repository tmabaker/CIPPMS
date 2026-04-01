// =============================================
// HARDCODED TENANT
// =============================================
var TENANT_ID     = '4ceb1a80-7fd3-4760-a827-aedf07b8d4fa';
var TENANT_DOMAIN = 'geauxautomotive.com';
var TENANT_NAME   = 'Geaux Automotive';

// =============================================
// DATA STORE
// =============================================
var STORE_KEY = 'ga_userform_v7';

var defaultData = {
  companies: ["Express Chevrolet - Brownsville","Express Chevrolet - Dyersburg","Express Chevrolet - Terry","Geaux Automotive - Corporate","Geaux CDJR - Plaquemine","Geaux Chevrolet - Laplace","Geaux Chevrolet - West","Geaux Ford - Waveland","Gulf Auto Direct - Waveland"],
  domains: ["expressautogroup.com","geauxautomotive.com","gulfautodirect.com"],
  departments: ["Accounting","Administration","Collision","Executive Operations","Fixed Operations","Information Technology","Marketing","Operations","Parts","Parts and Service","Remote","Sales","Service"],
  jobTitles: ["Accounting - Billing","Accounting - Clerk","Accounting - Payables","BDC Sales","BDC Service","Body Shop Estimator","Body Shop Manager","Body Shop Technician","Cashier","Chief Executive Officer","Chief Financial Officer","Chief Marketing Officer","Chief Operating Officer","Controller","Detailer","Executive Assistant","F&I Manager","Fixed Operations Manager","Fleet Sales Advisor","Fleet Sales Manager","General Manager","General Sales Manager","Human Resources Assistant","Human Resources Director","Human Resources Intern","Inventory Manager","Marketing Assistant","Marketing Director","Office Manager","Parts Advisor","Parts Manager","Porter","Receptionist","Runner","Sales Advisor","Sales Manager","Service Advisor","Service Lube Technician","Service Manager","Service Technician"],
  licenses: ["Microsoft 365 Business Basic","Microsoft 365 Business Premium","Microsoft 365 Business Standard","Microsoft 365 E3","Microsoft 365 E5"],
  addresses: [{"label":"Brownsville","street":"1336 S Dupree Street","city":"Brownsville","state":"Tennessee","postal":"38012","country":"US"},{"label":"Dyersburg","street":"125 US-51 Bypass","city":"Dyersburg","state":"Tennessee","postal":"38024","country":"US"},{"label":"Terry","street":"12580 I-55 Service Road","city":"Terry","state":"Mississippi","postal":"39170","country":"US"},{"label":"Corporate","street":"11408 Lake Sherwood Ave N Suite A","city":"Baton Rouge","state":"Louisiana","postal":"70816","country":"US"},{"label":"Laplace","street":"2020 West Airline Highway","city":"Laplace","state":"Louisiana","postal":"70068","country":"US"},{"label":"Plq - West","street":"23085 LA-1","city":"Plaquemine","state":"Louisiana","postal":"70764","country":"US"},{"label":"Plq - CDJR","street":"24945 LA-1","city":"Plaquemine","state":"Louisiana","postal":"70764","country":"US"},{"label":"Waveland - Ford","street":"105 US-90","city":"Waveland","state":"Mississippi","postal":"39576","country":"US"},{"label":"Waveland - GAD","street":"9050 MS-603","city":"Waveland","state":"Mississippi","postal":"39576","country":"US"}]
};
var configData = JSON.parse(JSON.stringify(defaultData));

// Load data: defaults + any localStorage overrides
function loadData() {
  data = JSON.parse(JSON.stringify(defaultData));
  try {
    var _s = localStorage.getItem(STORE_KEY);
    var overrides = _s ? JSON.parse(_s) : {};
    ['companies','domains','departments','jobTitles','licenses','addresses'].forEach(function(k){
      if (overrides[k]) data[k] = overrides[k];
    });
  } catch(e) {}
  ['companies','domains','departments','jobTitles','licenses'].forEach(function(k){ 
    if (data[k] && Array.isArray(data[k])) data[k].sort(); 
  });
}

function save(){ 
  // Only save changes that differ from defaults to localStorage
  var localOverrides = {};
  ['companies','domains','departments','jobTitles','licenses','addresses'].forEach(function(k){
    if (JSON.stringify(data[k]) !== JSON.stringify(configData[k])) {
      localOverrides[k] = data[k];
    }
  });
  try{ 
    if (Object.keys(localOverrides).length > 0) {
      localStorage.setItem(STORE_KEY, JSON.stringify(localOverrides)); 
    } else {
      localStorage.removeItem(STORE_KEY);
    }
  }catch(e){} 
}

// Reset to defaults function
function resetToDefaults() {
  if (!confirm('This will reset all lists to defaults. Are you sure?')) return;
  try {
    localStorage.removeItem(STORE_KEY);
    data = JSON.parse(JSON.stringify(defaultData));
    populateAllSelects();
    renderCompanies(); 
    renderDepartments(); 
    renderJobTitles(); 
    renderAddresses(); 
    renderDomains();
    renderLicenses();
    showToast('Lists reset to defaults!', false);
  } catch(e) {
    showToast('Error resetting to defaults', true);
  }
}

// Auth - Hardcoded as specified
function getKey()     { return '_MNhh4ZlkdwQfRurLGXkWs0MGshcx18cheGXZYNt6F9RAzFuacKCWg=='; }
function getBaseUrl() { return ''; }

// Auto-check connection status on page load
function checkConnectionStatus() {
  setStatus('', 'Checking...');
  cippFetch('/api/ListLicenses?tenantFilter=' + encodeURIComponent(TENANT_ID), 'GET')
    .then(function(r){ 
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json(); 
    })
    .then(function(result){
      setStatus('connected', 'Connected to ' + TENANT_NAME);
    })
    .catch(function(err){
      setStatus('error', 'Connection failed');
      console.error('CIPP connection check failed:', err);
    });
}

// =============================================
// INIT
// =============================================
window.addEventListener('DOMContentLoaded', function(){
  loadData();

  // Ensure tenant domain is in domains list
  if (data.domains && data.domains.indexOf(TENANT_DOMAIN) === -1) {
    data.domains.unshift(TENANT_DOMAIN);
    data.domains.sort();
    save();
  }

  populateAllSelects();
  updatePreview();

  // Auto-check connection status on page load
  checkConnectionStatus();
  
  // Auto-load licenses on page load
  if (getKey()) {
    loadLicenses(TENANT_ID);
  }
});

// =============================================
// CIPP API
// =============================================
function apiUrl(path){
  var base = getBaseUrl();
  return base ? base.replace(/\/$/, '') + path : path;
}

function cippFetch(path, method, body){
  var opts = { method: method || 'GET', headers: { 'Content-Type': 'application/json' } };
  var key = getKey();
  if (key) opts.headers['x-functions-key'] = key;
  if (body) opts.body = JSON.stringify(body);
  return fetch(apiUrl(path), opts);
}

function loadLicenses(tenantId){
  var sel = document.getElementById('license');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Loading licenses... --</option>';

  cippFetch('/api/ListLicenses?tenantFilter=' + encodeURIComponent(tenantId), 'GET')
    .then(function(r){ 
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json(); 
    })
    .then(function(result){
      var list = Array.isArray(result) ? result : (result.Results || result.value || []);
      sel.innerHTML = '<option value="">-- No License --</option>';
      data.licenses.forEach(function(friendly){
        var word  = friendly.split(' ')[2] || '';
        var match = list.find(function(sku){
          return (sku.SkuPartNumber||'').toLowerCase().indexOf(word.toLowerCase()) !== -1
              || (sku.productName  ||'').toLowerCase().indexOf(friendly.toLowerCase()) !== -1;
        });
        if (match){
          var o = document.createElement('option');
          o.value       = match.SkuId || match.skuId || friendly;
          o.textContent = friendly;
          sel.appendChild(o);
        }
      });
      list.forEach(function(sku){
        var nm = sku.productName || sku.SkuPartNumber || sku.skuPartNumber || '';
        if (!nm) return;
        var already = false;
        for (var i = 0; i < sel.options.length; i++){
          if (sel.options[i].textContent === nm){ already = true; break; }
        }
        if (!already){
          var o = document.createElement('option');
          o.value       = sku.SkuId || sku.skuId || nm;
          o.textContent = nm + (sku.availableUnits !== undefined ? ' (' + sku.availableUnits + ' avail)' : '');
          sel.appendChild(o);
        }
      });
      updatePreview();
    })
    .catch(function(err){
      console.error('Failed to load licenses from CIPP, falling back to config data:', err);
      // Fall back to license list from ga-config.json
      sel.innerHTML = '<option value="">-- No License --</option>';
      if (data.licenses && data.licenses.length) {
        data.licenses.forEach(function(l){
          var o = document.createElement('option');
          o.value = l; o.textContent = l;
          sel.appendChild(o);
        });
      }
      updatePreview();
    });
}

// =============================================
// SUBMIT TO CIPP
// =============================================
function submitToCIPP(){
  var first    = (document.getElementById('firstName').value    || '').trim();
  var last     = (document.getElementById('lastName').value     || '').trim();
  var company  =  document.getElementById('companyName').value  || '';
  var dept     =  document.getElementById('department').value   || '';
  var title    =  document.getElementById('jobTitle').value     || '';
  var empId    = (document.getElementById('employeeId').value   || '').trim();
  var manager  = (document.getElementById('manager').value      || '').trim();
  var mobile   = (document.getElementById('mobilePhone').value  || '').trim();
  var bizPhone = (document.getElementById('businessPhone').value|| '').trim();
  var street   = (document.getElementById('streetAddress').value|| '').trim();
  var city     = (document.getElementById('city').value         || '').trim();
  var state    = (document.getElementById('state').value        || '').trim();
  var postal   = (document.getElementById('postalCode').value   || '').trim();
  var country  = (document.getElementById('country').value      || '').trim();
  var loc      =  document.getElementById('usageLocation').value|| 'US';
  var licSel   =  document.getElementById('license');
  var licId    =  licSel.value;
  var licName  =  licSel.options[licSel.selectedIndex] ? licSel.options[licSel.selectedIndex].textContent : '';
  var copyFrom = (document.getElementById('copyFrom').value     || '').trim();
  var startDate= (document.getElementById('startDate').value    || '').trim();
  var birthday = (document.getElementById('birthday').value     || '').trim();
  var upn      =  buildUPN(first, last);
  var alias    =  upn.split('@')[0];
  var domain   =  upn.split('@')[1] || TENANT_DOMAIN;
  var display  = (first + ' ' + last).trim();

  /* key always available */
  if (!first || !last)   { showResult('error', 'Missing Name',     'Please enter first and last name.'); return; }
  if (!company || !dept) { showResult('error', 'Missing Fields',   'Please select a Company and Department.'); return; }

  // -------------------------------------------------------
  // Build payload matching CIPP's expected field names.
  // Reference: CIPP source → New-CIPPUser.ps1 $BodyToShip
  //   givenName, surname, displayName, department, jobTitle,
  //   mobilePhone, streetAddress, city, state, country,
  //   postalCode, companyName, usageLocation, businessPhones
  //
  // Reference: New-CIPPUserTask.ps1
  //   setManager  → { value: "upn" }
  //   copyFrom    → { value: "upn" }
  //   licenses    → { value: [skuId, ...] }  (NOT an array of objects)
  // -------------------------------------------------------
  var payload = {
    tenantFilter:   TENANT_ID,
    tenantID:       TENANT_ID,
    displayName:    display,
    username:       alias,
    mailNickname:   alias,
    givenName:      first,
    surname:        last,
    Domain:         domain,
    primDomain:     { label: domain, value: domain },
    Autopassword:   true,
    MustChangePass: true,
    companyName:    company,
    department:     dept,
    jobTitle:       title,
    mobilePhone:    mobile,
    streetAddress:  street,
    city:           city,
    state:          state,
    country:        country,
    postalCode:     postal,
    usageLocation:  { label: loc, value: loc }
  };

  // businessPhones: only add if provided
  if (bizPhone) payload.businessPhones = [bizPhone];

  // Manager: CIPP expects { value: "manager@domain.com" }
  if (manager) payload.setManager = { value: manager };

  // Copy from: CIPP expects { value: "user@domain.com" }
  if (copyFrom) payload.copyFrom = { value: copyFrom };

  // Licenses: CIPP checks $UserObj.licenses.value (expects .value to be array of SKU IDs)
  if (licId) payload.licenses = { value: [licId] };

  // employeeId and employeeHireDate are not in CIPP's default $BodyToShip,
  // but New-CIPPUser.ps1 iterates defaultAttributes and adds each to the
  // Graph API request body as: propertyName = defaultAttributes.propertyName.value
  var extraAttrs = {};
  if (empId)     extraAttrs.employeeId       = { value: empId };
  if (startDate) extraAttrs.employeeHireDate = { value: startDate };
  // Birthday stored in extensionAttribute1 via Graph's onPremisesExtensionAttributes
  if (birthday)  extraAttrs.onPremisesExtensionAttributes = {
    value: { extensionAttribute1: birthday }
  };
  if (Object.keys(extraAttrs).length > 0) payload.defaultAttributes = extraAttrs;

  // Debug: log the payload so we can verify what's being sent
  console.log('CIPP AddUser payload:', JSON.stringify(payload, null, 2));

  var btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating user...';
  hideResult();

  cippFetch('/api/AddUser', 'POST', payload)
    .then(function(r){
      return r.json().then(function(body){ return { ok: r.ok, status: r.status, body: body }; });
    })
    .then(function(res){
      btn.disabled = false;
      btn.innerHTML = 'Create User in CIPP &#9889;';

      var results = res.body && res.body.Results ? res.body.Results : null;
      var msgText  = '';
      var password = '';
      var success  = false;

      if (Array.isArray(results)){
        // CIPP returns an array that can contain BOTH strings and objects.
        // We must type-check each item before calling string methods.
        results.forEach(function(item){
          if (typeof item === 'string'){
            msgText += item + '\n';
            if (item.toLowerCase().indexOf('created') !== -1 || item.toLowerCase().indexOf('success') !== -1) success = true;
          } else if (item && typeof item === 'object'){
            if (item.state === 'success') success = true;
            if (item.resultText) {
              msgText += item.resultText + '\n';
              if (typeof item.resultText === 'string' && item.resultText.toLowerCase().indexOf('password') !== -1 && item.copyField){
                password = item.copyField;
              }
            } else {
              // Fallback: stringify the object so nothing is silently lost
              msgText += JSON.stringify(item) + '\n';
            }
          } else if (item !== null && item !== undefined) {
            // Catch any other types (numbers, booleans, etc.)
            msgText += String(item) + '\n';
          }
        });
      } else if (results !== null && results !== undefined){
        if (typeof results === 'string'){
          msgText = results;
          success = results.toLowerCase().indexOf('created') !== -1 || results.toLowerCase().indexOf('success') !== -1;
        } else if (typeof results === 'object'){
          msgText = JSON.stringify(results);
          success = res.ok;
        } else {
          msgText = String(results);
          success = res.ok;
        }
      } else {
        msgText = JSON.stringify(res.body);
        success = res.ok;
      }

      if (success){
        var successMsg = 'UPN: ' + upn + '\n' +
          'Tenant: ' + TENANT_NAME + ' (' + TENANT_DOMAIN + ')\n\n' +
          msgText.trim();
        if (password){
          successMsg += '\n\n*** TEMPORARY PASSWORD ***\n' + password + '\n(User must change on first login)';
        }
        showResult('success', 'User Created Successfully', successMsg);
        showToast('User created: ' + upn, false);
      } else {
        showResult('error', 'CIPP Returned an Error',
          msgText || JSON.stringify(res.body) + '\n\nHTTP Status: ' + res.status
        );
      }
    })
    .catch(function(err){
      btn.disabled = false;
      btn.innerHTML = 'Create User in CIPP &#9889;';
      showResult('error', 'Request Failed',
        (err && err.message ? err.message : String(err)) +
        '\n\nEnsure your Function Key is correct and you are accessing this page from your CIPP domain.'
      );
    });
}

// =============================================
// SETTINGS - GUTTED (Auth is now hardcoded)
// =============================================
// These functions are kept as stubs to avoid breaking any references
function saveAndTest(){ console.log('saveAndTest called but auth is hardcoded'); }
function clearKey(){ console.log('clearKey called but auth is hardcoded'); }
function toggleKeyVis(){ console.log('toggleKeyVis called but Settings tab removed'); }
function showConnResult(type, msg){ console.log('showConnResult called but Settings tab removed'); }

// =============================================
// POPULATE SELECTS
// =============================================
function populateAllSelects(){
  var cs = document.getElementById('companyName');
  if (cs){
    var prevC = cs.value;
    cs.innerHTML = '<option value="">-- Select Company --</option>';
    data.companies.forEach(function(c){
      var o = document.createElement('option');
      o.value = c; o.textContent = c;
      if (c === prevC) o.selected = true;
      cs.appendChild(o);
    });
  }

  var dp = document.getElementById('department');
  if (dp){
    var prevD = dp.value;
    dp.innerHTML = '<option value="">-- Select Department --</option>';
    data.departments.forEach(function(d){
      var o = document.createElement('option');
      o.value = d; o.textContent = d;
      if (d === prevD) o.selected = true;
      dp.appendChild(o);
    });
  }

  var jt = document.getElementById('jobTitle');
  if (jt){
    var prevJ = jt.value;
    jt.innerHTML = '<option value="">-- Select Job Title --</option>';
    data.jobTitles.forEach(function(t){
      var o = document.createElement('option');
      o.value = t; o.textContent = t;
      if (t === prevJ) o.selected = true;
      jt.appendChild(o);
    });
  }

  var ds = document.getElementById('emailDomain');
  if (ds){
    var prevDm = ds.value;
    ds.innerHTML = '';
    data.domains.forEach(function(d){
      var o = document.createElement('option');
      o.value = d; o.textContent = d;
      if (d === prevDm) o.selected = true;
      ds.appendChild(o);
    });
    if (!ds.value && data.domains.length) ds.value = data.domains[0];
  }

  var as = document.getElementById('officeAddress');
  if (as){
    var prevA = as.value;
    as.innerHTML = '<option value="">-- Select Address --</option>';
    data.addresses.forEach(function(a, i){
      var o = document.createElement('option');
      o.value = i; o.textContent = a.label;
      if (String(i) === prevA) o.selected = true;
      as.appendChild(o);
    });
  }
}

function fillAddress(){
  var idx = document.getElementById('officeAddress').value;
  if (idx === '') return;
  var a = data.addresses[parseInt(idx)];
  if (!a) return;
  document.getElementById('streetAddress').value = a.street;
  document.getElementById('city').value          = a.city;
  document.getElementById('state').value         = a.state;
  document.getElementById('postalCode').value    = a.postal;
  document.getElementById('country').value       = a.country;
  updatePreview();
}

// =============================================
// UPN BUILDER
// =============================================
function buildUPN(first, last){
  var fmtEl  = document.getElementById('upnFormat');
  var domEl  = document.getElementById('emailDomain');
  var fmt    = fmtEl ? fmtEl.value : 'flast';
  var domain = domEl && domEl.value ? domEl.value : TENANT_DOMAIN;
  first = first.toLowerCase().replace(/[^a-z]/g, '');
  last  = last.toLowerCase().replace(/[^a-z]/g,  '');
  if (!first && !last) return '--';
  var local = '';
  if      (fmt === 'flast')     local = first.charAt(0) + last;
  else if (fmt === 'firstlast') local = first + '.' + last;
  else if (fmt === 'firstl')    local = first + '.' + last.charAt(0);
  else if (fmt === 'first')     local = first;
  return local + '@' + domain;
}

function formatBirthday(el){
  var v = el.value.replace(/[^0-9]/g, '');
  if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
  el.value = v;
}

// =============================================
// LIVE PREVIEW
// =============================================
function updatePreview(){
  var first   = (document.getElementById('firstName').value  || '').trim();
  var last    = (document.getElementById('lastName').value   || '').trim();
  var company =  document.getElementById('companyName').value|| '';
  var dept    =  document.getElementById('department').value || '';
  var title   =  document.getElementById('jobTitle').value   || '';
  var city    = (document.getElementById('city').value       || '').trim();
  var state   = (document.getElementById('state').value      || '').trim();
  var mobile  = (document.getElementById('mobilePhone').value|| '').trim();
  var start   = (document.getElementById('startDate').value  || '').trim();
  var licSel  =  document.getElementById('license');
  var licName =  licSel && licSel.options[licSel.selectedIndex] ? licSel.options[licSel.selectedIndex].textContent : '--';
  var upn     =  buildUPN(first, last);
  var display = (first || last) ? (first + ' ' + last).trim() : '--';

  var dn = document.getElementById('displayName');
  var up = document.getElementById('upnPreview');
  if (dn) dn.innerHTML = display !== '--' ? '<span class="val">' + display + '</span>' : '--';
  if (up) up.innerHTML = upn     !== '--' ? '<span class="val">' + upn     + '</span>' : '--';

  var initials = ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || '?';
  setText('prev-avatar',   initials);
  setText('prev-name',     display);
  setText('prev-title',    title || dept || '--');
  setText('prev-email',    upn);
  setText('prev-company',  company  || '--');
  setText('prev-dept',     dept     || '--');
  setText('prev-location', (city && state) ? city + ', ' + state : (city || state || '--'));
  setText('prev-mobile',   mobile   || '--');
  setText('prev-license',  (licName && licName.indexOf('--') === -1 && licName.indexOf('Loading') === -1) ? licName : '--');
  setText('prev-start',    start    || '--');

  var fp = document.getElementById('upnFormatPreview');
  if (fp) fp.textContent = buildUPN('Jane', 'Smith');
}

function setText(id, val){
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

// =============================================
// ADMIN: COMPANIES
// =============================================
function renderCompanies(){
  var el = document.getElementById('companiesList'); if (!el) return;
  el.innerHTML = '';
  if (!data.companies.length){ el.innerHTML = '<p style="color:var(--text-dim);font-size:12px;padding:6px 0;">No companies yet.</p>'; return; }
  data.companies.forEach(function(c, i){
    var d = document.createElement('div'); d.className = 'list-item';
    d.innerHTML = '<span class="item-text">' + escHtml(c) + '</span><div class="item-actions"><button class="btn btn-danger btn-sm" onclick="removeCompany(' + i + ')">X</button></div>';
    el.appendChild(d);
  });
}
function addCompany(){
  var inp = document.getElementById('newCompany'); var val = inp.value.trim();
  if (!val) return;
  if (data.companies.indexOf(val) !== -1){ showToast('Already exists!', true); return; }
  data.companies.push(val); data.companies.sort();
  save(); renderCompanies(); populateAllSelects(); inp.value = '';
}
function removeCompany(i){ data.companies.splice(i, 1); save(); renderCompanies(); populateAllSelects(); }

// =============================================
// ADMIN: DEPARTMENTS
// =============================================
function renderDepartments(){
  var el = document.getElementById('departmentsList'); if (!el) return;
  el.innerHTML = '';
  if (!data.departments.length){ el.innerHTML = '<p style="color:var(--text-dim);font-size:12px;padding:6px 0;">No departments yet.</p>'; return; }
  data.departments.forEach(function(d, i){
    var div = document.createElement('div'); div.className = 'list-item';
    div.innerHTML = '<span class="item-text">' + escHtml(d) + '</span><div class="item-actions"><button class="btn btn-danger btn-sm" onclick="removeDepartment(' + i + ')">X</button></div>';
    el.appendChild(div);
  });
}
function addDepartment(){
  var inp = document.getElementById('newDepartment'); var val = inp.value.trim();
  if (!val) return;
  if (data.departments.indexOf(val) !== -1){ showToast('Already exists!', true); return; }
  data.departments.push(val); data.departments.sort();
  save(); renderDepartments(); populateAllSelects(); inp.value = '';
}
function removeDepartment(i){ data.departments.splice(i, 1); save(); renderDepartments(); populateAllSelects(); }

// =============================================
// ADMIN: JOB TITLES
// =============================================
function renderJobTitles(){
  var el = document.getElementById('jobTitlesList'); if (!el) return;
  el.innerHTML = '';
  if (!data.jobTitles.length){ el.innerHTML = '<p style="color:var(--text-dim);font-size:12px;padding:6px 0;">No job titles yet.</p>'; return; }
  data.jobTitles.forEach(function(t, i){
    var d = document.createElement('div'); d.className = 'list-item';
    d.innerHTML = '<span class="item-text">' + escHtml(t) + '</span><div class="item-actions"><button class="btn btn-danger btn-sm" onclick="removeJobTitle(' + i + ')">X</button></div>';
    el.appendChild(d);
  });
}
function addJobTitle(){
  var inp = document.getElementById('newJobTitle'); var val = inp.value.trim();
  if (!val) return;
  if (data.jobTitles.indexOf(val) !== -1){ showToast('Already exists!', true); return; }
  data.jobTitles.push(val); data.jobTitles.sort();
  save(); renderJobTitles(); populateAllSelects(); inp.value = '';
}
function removeJobTitle(i){ data.jobTitles.splice(i, 1); save(); renderJobTitles(); populateAllSelects(); }

// =============================================
// ADMIN: ADDRESSES
// =============================================
function renderAddresses(){
  var el = document.getElementById('addressesList'); if (!el) return;
  el.innerHTML = '';
  if (!data.addresses.length){ el.innerHTML = '<p style="color:var(--text-dim);font-size:12px;padding:6px 0;">No addresses yet.</p>'; return; }
  var sorted = data.addresses.slice().sort(function(a, b){ return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1; });
  sorted.forEach(function(a){
    var i = data.addresses.indexOf(a);
    var d = document.createElement('div'); d.className = 'list-item';
    d.innerHTML = '<span class="item-text"><strong style="color:var(--text)">' + escHtml(a.label) + '</strong><br><span style="font-size:11px;color:var(--text-muted)">' + escHtml(a.street) + ', ' + escHtml(a.city) + ' ' + escHtml(a.state) + '</span></span><div class="item-actions"><button class="btn btn-danger btn-sm" onclick="removeAddress(' + i + ')">X</button></div>';
    el.appendChild(d);
  });
}
function addAddress(){
  var label   = document.getElementById('addrLabel').value.trim();
  var street  = document.getElementById('addrStreet').value.trim();
  var city    = document.getElementById('addrCity').value.trim();
  var state   = document.getElementById('addrState').value.trim();
  var postal  = document.getElementById('addrPostal').value.trim();
  var country = document.getElementById('addrCountry').value.trim();
  if (!label || !street || !city){ showToast('Label, Street & City required', true); return; }
  data.addresses.push({ label:label, street:street, city:city, state:state, postal:postal, country:country });
  save(); renderAddresses(); populateAllSelects();
  ['addrLabel','addrStreet','addrCity','addrState','addrPostal'].forEach(function(id){ document.getElementById(id).value = ''; });
  document.getElementById('addrCountry').value = 'US';
}
function removeAddress(i){ data.addresses.splice(i, 1); save(); renderAddresses(); populateAllSelects(); }

// =============================================
// ADMIN: DOMAINS
// =============================================
function renderDomains(){
  var el = document.getElementById('domainsList'); if (!el) return;
  el.innerHTML = '';
  if (!data.domains.length){ el.innerHTML = '<p style="color:var(--text-dim);font-size:12px;padding:6px 0;">No domains yet.</p>'; return; }
  data.domains.forEach(function(d, i){
    var div = document.createElement('div'); div.className = 'list-item';
    div.innerHTML = '<span class="item-text" style="font-family:var(--mono);font-size:12px;">@' + escHtml(d) + '</span><div class="item-actions"><button class="btn btn-danger btn-sm" onclick="removeDomain(' + i + ')">X</button></div>';
    el.appendChild(div);
  });
}
function addDomain(){
  var inp = document.getElementById('newDomain');
  var val = inp.value.trim().replace(/^@/, '').toLowerCase();
  if (!val) return;
  if (data.domains.indexOf(val) !== -1){ showToast('Already exists!', true); return; }
  data.domains.push(val); data.domains.sort();
  save(); renderDomains(); populateAllSelects(); inp.value = '';
}
function removeDomain(i){
  if (data.domains.length <= 1){ showToast('Must keep at least one domain', true); return; }
  data.domains.splice(i, 1); save(); renderDomains(); populateAllSelects();
}

// =============================================
// SETTINGS: LICENSES
// =============================================
function renderLicenses(){
  var el = document.getElementById('licenseList'); if (!el) return;
  el.innerHTML = '';
  if (!data.licenses.length){ el.innerHTML = '<p style="color:var(--text-dim);font-size:12px;padding:6px 0;">No licenses yet.</p>'; return; }
  data.licenses.forEach(function(l, i){
    var d = document.createElement('div'); d.className = 'list-item';
    d.innerHTML = '<span class="item-text">' + escHtml(l) + '</span><div class="item-actions"><button class="btn btn-danger btn-sm" onclick="removeLicense(' + i + ')">X</button></div>';
    el.appendChild(d);
  });
}
function addLicense(){
  var inp = document.getElementById('newLicense'); var val = inp.value.trim();
  if (!val) return;
  if (data.licenses.indexOf(val) !== -1){ showToast('Already exists!', true); return; }
  data.licenses.push(val); data.licenses.sort();
  save(); renderLicenses(); inp.value = '';
}
function removeLicense(i){ data.licenses.splice(i, 1); save(); renderLicenses(); }

// =============================================
// EXPORT / IMPORT
// =============================================
function exportLists(){
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = 'GAUserSetup-lists-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('Lists exported!', false);
}

function importLists(){
  var raw = document.getElementById('importJson').value.trim();
  if (!raw){ showToast('Paste your exported JSON first', true); return; }
  try {
    var imported = JSON.parse(raw);
    var keys = ['companies','domains','departments','jobTitles','licenses','addresses'];
    var count = 0;
    keys.forEach(function(k){
      if (imported[k] && Array.isArray(imported[k])){
        data[k] = imported[k];
        if (k !== 'addresses') data[k].sort();
        count++;
      }
    });
    save();
    populateAllSelects();
    var res = document.getElementById('importResult');
    if (res){ res.style.display = 'block'; res.textContent = 'Imported ' + count + ' list(s) successfully. Your data has been restored.'; }
    showToast('Lists imported!', false);
    document.getElementById('importJson').value = '';
  } catch(e){
    showToast('Invalid JSON -- check your export file', true);
  }
}

// =============================================
// TAB SWITCHING
// =============================================
function switchTab(name){
  var tabEls   = document.querySelectorAll('.tab');
  var panelEls = document.querySelectorAll('.panel');
  var names    = ['form', 'admin']; // Settings tab removed

  tabEls.forEach(function(t, i){
    t.classList.toggle('active', names[i] === name);
  });
  panelEls.forEach(function(p){
    p.classList.remove('active');
  });

  var target = document.getElementById('panel-' + name);
  if (target) target.classList.add('active');

  if (name === 'admin') { 
    renderCompanies(); 
    renderDepartments(); 
    renderJobTitles(); 
    renderAddresses(); 
    renderDomains();
    renderLicenses(); // Now part of admin tab
  }
}

// =============================================
// HELPERS
// =============================================
function clearForm(){
  ['firstName','lastName','employeeId','manager','mobilePhone','businessPhone',
   'streetAddress','city','state','postalCode','copyFrom','startDate','birthday'
  ].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('country').value = 'US';
  ['companyName','department','officeAddress','jobTitle'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });
  hideResult();
  updatePreview();
}

function showResult(type, title, body){
  var el = document.getElementById('resultBox');
  if (!el) return;
  el.className = 'result-box show ' + type;
  el.innerHTML = '<div class="result-title">' + escHtml(title) + '</div><pre style="font-size:12px;white-space:pre-wrap;font-family:var(--mono);margin-top:6px;">' + escHtml(body) + '</pre>';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResult(){
  var el = document.getElementById('resultBox');
  if (el){ el.className = 'result-box'; el.innerHTML = ''; }
}

function setStatus(type, text){
  var dot  = document.getElementById('statusDot');
  var span = document.getElementById('statusText');
  if (dot)  dot.className    = 'status-dot' + (type ? ' ' + type : '');
  if (span){ span.textContent = text; span.style.color = type === 'connected' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--text-muted)'; }
}

function showToast(msg, isWarn){
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent      = (isWarn ? 'Warning: ' : 'Done: ') + msg;
  t.style.background = isWarn ? '#f7a94f' : '#3ecf8e';
  t.style.color      = '#0f1117';
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2600);
}

function escHtml(str){
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}
