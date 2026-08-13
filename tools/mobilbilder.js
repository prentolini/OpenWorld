/* Tar skjermbilder av spillet slik det ser ut på en mobil (390×844).
 * Kjør:  node tools/mobilbilder.js
 */
const path=require('path'),fs=require('fs');
const {chromium}=require('playwright-core');
function finn(){const rot='/opt/pw-browsers';for(const m of fs.readdirSync(rot))if(fs.existsSync(path.join(rot,m,'chrome-linux/chrome')))return path.join(rot,m,'chrome-linux/chrome');}
(async()=>{
const b=await chromium.launch({executablePath:finn(),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>console.log('JS-FEIL:',e.message));
await p.goto('file://'+path.join(__dirname,'..','index.html'));
await p.waitForSelector('#startKnapp');
await p.screenshot({path:path.join(__dirname,'..','skjermbilder')+'/mobil-karaktervalg.png'});
// velg en karakter med tydelig utseende
await p.click('[data-akt="velg-karakter"][data-id="folketaler"]');
await p.waitForTimeout(150);
await p.screenshot({path:path.join(__dirname,'..','skjermbilder')+'/mobil-karaktervalg.png'});
await p.click('#startKnapp');
await p.waitForSelector('#app:not(.skjult)');
await p.click('.modal-bunn .knapp');
await p.evaluate(()=>{
  const s=OW.App.s; s.era=2; s.pop=320;
  s.res={tre:2e5,stein:2e5,mat:2e5,jern:2e5,gull:2e5,kunnskap:2e5};
  s.bygg={radhus:11,hus:10,tomrer:8,gard:7,steinbrudd:6,lager:7,marked:5,bibliotek:5,smie:4,festplass:3,kaserne:4,bymur:3,havn:3};
  s.ko=[{id:'katedral',niva:1,start:Date.now(),slutt:Date.now()+180000},
        {id:'marked',niva:6,start:Date.now(),slutt:Date.now()+90000}];
  OW.Scene._harRort=false; OW.App.tegn(true);
});
await p.waitForTimeout(1500);
await p.evaluate(()=>{OW.Scene._tid=55});
await p.waitForTimeout(700);
await p.screenshot({path:path.join(__dirname,'..','skjermbilder')+'/mobil-by.png'});
// nærbilde av gatelivet
await p.evaluate(()=>{OW.Scene.kamera.dist=17;OW.Scene.kamera.pitch=0.35;OW.Scene.kamera.yaw=3.9;OW.Scene._harRort=true;});
await p.waitForTimeout(600);
await p.screenshot({path:path.join(__dirname,'..','skjermbilder')+'/mobil-naerbilde.png'});
const info=await p.evaluate(()=>({folk:OW.Scene.antallFolk, kar:OW.App.s.karakter,
  lykke:Math.round(OW.App.d.lykke), poptak:OW.App.d.popTak}));
console.log('  Folk i gatene (hjørner):',info.folk,'| karakter:',info.kar,'| lykke:',info.lykke,'| poptak:',info.poptak);
await b.close();
  console.log('  📸 Mobilbilder lagret i skjermbilder/');
})();
