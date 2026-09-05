'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../dist');

test('all hosted entrypoint assets exist and scripts parse',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    const ref=match[1];if(ref.startsWith('#')||ref.startsWith('https:'))continue;
    assert.ok(fs.existsSync(path.join(root,ref)),`Missing ${ref}`);
  }
  for(const file of ['model.js','app.js','sw.js'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
  for(const item of manifest.icons)assert.ok(fs.existsSync(path.join(root,item.src)));
});
test('portable app has no external script, stylesheet, or manifest dependencies',()=>{
  const html=fs.readFileSync(path.join(root,'afterlight-offline.html'),'utf8');
  assert.doesNotMatch(html,/<script[^>]+src=/i);
  assert.doesNotMatch(html,/<link[^>]+rel="(?:stylesheet|manifest)"/i);
  assert.doesNotMatch(html,/@import\b/i);
  assert.match(html,/AFTERLIGHT_PORTABLE = true/);
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length,3);
  for(const [i,match] of scripts.entries())new vm.Script(match[1],{filename:'portable-script-'+i});
  assert.ok(html.indexOf('id="app"')<html.indexOf('const M = window.AfterlightModel'),'App must run after markup exists');
});
test('a plan containing HTML closing tags can be embedded without executing them',()=>{
  const payload={version:1,notes:'</script><img src=x onerror=alert(1)> & "quotes"'};
  const encoded=JSON.stringify(payload).replace(/</g,'\\u003c');
  assert.ok(!encoded.includes('<'));
  assert.deepEqual(JSON.parse(encoded),payload);
});
test('no remote runtime dependencies or analytics are introduced',()=>{
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  const calls=[...app.matchAll(/fetch\(([^,)]+)/g)].map(m=>m[1]);
  assert.deepEqual(calls,["'afterlight-offline.html'"]);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.doesNotMatch(html,/https?:\/\/[^"\s]+\.(?:js|css)/i);
});
