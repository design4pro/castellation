import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const steps = JSON.parse(readFileSync(resolve(root, '.agent/bookshop-plan.json'), 'utf8'));
const directory = resolve(root, 'apps/web/.impeccable/review/bookshop-final');
mkdirSync(directory, { recursive: true });
const routeFilter = process.argv[2];
const routes = [...new Set(steps.map((step) => step.route))].filter(route => !routeFilter || route === routeFilter);
const script = `
  const task=await taskSpace(7), page=task.page("p1");
  const steps=${JSON.stringify(steps.map(({iteration,route,selector})=>({iteration,route,selector})))};
  const results=[];
  for(const route of ${JSON.stringify(routes)}) {
    for(const width of [1440,390,320,768]) {
      await page.cdp("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width<760});
      await page.goto("https://castellation-web-dev.design4pro.workers.dev"+route+"?lang=en");
      if(route.endsWith("/map")) {
        await page.waitForSelector("#story-app[data-state=ready]",{state:"visible"});
        await page.click('loc=css:#graph [role="button"][aria-label="Alice"]');
        await page.waitForSelector("#map-detail:not([hidden])",{state:"visible"});
      }
      if(route==="/account") await page.waitForSelector("#account-form:not([hidden]),#auth-unavailable:not([hidden]),#signed-in:not([hidden])",{state:"visible"});
      if(route==="/books/alices-adventures-in-wonderland") await page.click("loc=css:.reading-entry-choice:first-child");
      await page.evaluate(async()=>{await document.fonts.ready;document.documentElement.style.scrollBehavior="auto";});
      const metrics=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth}));
      const targets=[];
      if(width===1440 || width===390) {
        for(const step of steps.filter(step=>step.route===route)) {
          await page.waitForSelector(step.selector,{state:"visible"});
          await page.evaluate(selector=>document.querySelector(selector).scrollIntoView({block:"center",behavior:"instant"}),step.selector);
          const screenshot=${JSON.stringify(directory)}+"/"+String(step.iteration).padStart(2,"0")+"-"+width+".png";
          await page.screenshot({path:screenshot});
          targets.push({iteration:step.iteration,screenshot});
        }
      }
      const contrast=await page.evaluate((selectors)=>{
        const color=value=>{const n=value.match(/[\\d.]+/g)?.map(Number)||[];return n.length>=3?[n[0],n[1],n[2],n[3]??1]:[0,0,0,0];};
        const mix=(front,back)=>[0,1,2].map(i=>front[i]*front[3]+back[i]*(1-front[3]));
        const luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
        const issues=[],seen=new Set();
        for(const selector of selectors) for(const element of document.querySelectorAll(selector+", "+selector+" *")) {
          if(seen.has(element) || element.closest("[aria-hidden=true]"))continue;seen.add(element);
          const text=[...element.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(" ");
          const style=getComputedStyle(element);
          if(!text || !element.getClientRects().length || style.visibility!=="visible")continue;
          const chain=[];let node=element,hasImage=false;
          while(node) {const s=getComputedStyle(node);chain.push(color(s.backgroundColor));if(s.backgroundImage!=="none")hasImage=true;node=node.parentElement;}
          if(hasImage || element.closest(".book-opening-art,.opening-visual,.chapter-page-art,.first-scene-art,.journal-art"))continue;
          let bg=[246,244,237];for(const c of chain.reverse())bg=mix(c,bg);
          const fg=mix(color(style.color),bg),a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
          const size=parseFloat(style.fontSize),large=size>=24 || (size>=18.66 && Number(style.fontWeight)>=700),minimum=large?3:4.5;
          if(ratio<minimum-.05)issues.push({text:text.slice(0,90),className:element.className,tag:element.tagName,color:style.color,background:bg.map(Math.round),ratio:Number(ratio.toFixed(2)),minimum});
        }
        return issues;
      },steps.filter(step=>step.route===route).map(step=>step.selector));
      results.push({route,...metrics,targets,contrast});
    }
  }
  await page.cdp("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await page.goto("https://castellation-web-dev.design4pro.workers.dev/?lang=en");
  await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo({top:0,behavior:"instant"});});
  await page.screenshot({path:${JSON.stringify(directory + '/desktop.png')}});
  await page.cdp("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await page.reload();
  await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo({top:0,behavior:"instant"});});
  await page.screenshot({path:${JSON.stringify(directory + '/mobile.png')}});
  for(const width of [1440,390]) {
    await page.cdp("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width<760});
    await page.goto("https://castellation-web-dev.design4pro.workers.dev/?lang=pl");
    await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo({top:0,behavior:"instant"});});
    await page.screenshot({path:${JSON.stringify(directory + '/polish-')}+width+".png"});
    await page.evaluate(()=>document.querySelector(".bookcase").scrollIntoView({block:"center",behavior:"instant"}));
    await page.screenshot({path:${JSON.stringify(directory + '/polish-bookcase-')}+width+".png"});
    const metrics=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,localizedLinks:[...document.querySelectorAll(".bound-book")].every(link=>new URL(link.href).searchParams.get("lang")==="pl")}));
    results.push({route:"/?lang=pl",...metrics,targets:[],contrast:[]});
  }
  console.log(JSON.stringify({results}));
`;
const result=spawnSync('ego-browser',['nodejs','-e',script],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
writeFileSync('/private/tmp/bookshop-final-browser.log',(result.stdout||'')+(result.stderr||''));
if(result.status!==0)throw new Error('Final browser verification failed; see /private/tmp/bookshop-final-browser.log');
const data=JSON.parse(readFileSync('/private/tmp/bookshop-final-browser.log', 'utf8').trim());
if(routeFilter) {
  const previous=JSON.parse(readFileSync(resolve(root,'.agent/bookshop-responsive.json'),'utf8'));
  const merged=new Map(previous.results.map(item=>[item.route+'|'+item.width,item]));
  for(const item of data.results)merged.set(item.route+'|'+item.width,item);
  data.results=[...merged.values()];
}
writeFileSync(resolve(root,'.agent/bookshop-responsive.json'),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({viewports:data.results.length,overflow:data.results.filter(item=>item.documentWidth>item.width+1).map(({route,width,documentWidth})=>({route,width,documentWidth})),contrastFindings:data.results.reduce((sum,item)=>sum+item.contrast.length,0)}));
