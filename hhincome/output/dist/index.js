define(["esri/WebMap","esri/views/MapView","esri/widgets/Expand","esri/widgets/Legend","esri/core/watchUtils","esri/renderers/smartMapping/statistics/histogram","esri/renderers/smartMapping/statistics/summaryStatistics","esri/widgets/HistogramRangeSlider"],(function(e,t,n,s,a,c,d,r){"use strict";e=e&&e.hasOwnProperty("default")?e.default:e,t=t&&t.hasOwnProperty("default")?t.default:t,n=n&&n.hasOwnProperty("default")?n.default:n,s=s&&s.hasOwnProperty("default")?s.default:s,a=a&&a.hasOwnProperty("default")?a.default:a,c=c&&c.hasOwnProperty("default")?c.default:c,d=d&&d.hasOwnProperty("default")?d.default:d,r=r&&r.hasOwnProperty("default")?r.default:r;const o=()=>{};let l;let i,u=[],m=[],p=[];const y=Array.from(document.querySelectorAll(".hhP")),h=Array.from(document.querySelectorAll(".clapP")),g=Array.from(document.querySelectorAll(".snareP")),f=Array.from(document.querySelectorAll(".bassP")),w=document.getElementById("hhPattern"),I=document.getElementById("cPattern"),C=document.getElementById("sPattern"),E=document.getElementById("bPattern"),v=document.getElementById("hhDelay"),B=document.getElementById("clapDelay"),P=document.getElementById("snareDelay"),S=document.getElementById("bassDelay"),_=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}),F=new p5.SoundFile("assets/808-open-hat-1.mp3",o),k=new p5.SoundFile("assets/808-clap.mp3",o),A=new p5.SoundFile("assets/processed-909.mp3",o),b=new p5.SoundFile("assets/808-snare-drum-1.mp3",o),D=[0,1,0,1,0,1,0,1,0,1],N=[0,0,0,1,0,0,1,0,1,0],H=[0,1,0,1,0,1,0,1,0,0],L=[0,0,1,0,0,1,0,0,1,0];function T({elements:e,pattern:t}){for(const n in e){const s=e[n];s.classList.remove("is-active"),t[n]&&s.classList.add("is-active")}}window.setup=function(){let o;window.createCanvas(1,1);const Y=document.getElementById("hh"),q=document.getElementById("clap"),x=document.getElementById("bass"),O=document.getElementById("snare");T({elements:y,pattern:D}),T({elements:h,pattern:N}),T({elements:g,pattern:L}),T({elements:f,pattern:H});const $=new p5.Phrase("hh",e=>{Y.checked&&(i.play(),F.play(e))},D),G=new p5.Phrase("clap",e=>{q.checked&&k.play(e)},N);let M=0;const R=new p5.Phrase("bass",e=>{if(x.checked&&(i.play(),A.play(e),o&&o.effect)){const e=o.effect.clone();0===M?(e.includedEffect="contrast(500%)",M=1):(e.includedEffect=null,M=0),o.effect=e}},H),V=new p5.Phrase("snare",e=>{O.checked&&(i.play(),b.play(e))},L),U=new p5.Part;U.addPhrase($),U.addPhrase(G),U.addPhrase(R),U.addPhrase(V);let j=new p5.Delay,z=new p5.Delay,J=new p5.Delay,Q=new p5.Delay;U.setBPM("60"),l=new p5.Reverb,l.process(F,3,2),l.process(b,3,2),l.process(k,3,2),i=new p5.Envelope,i.setADSR(.01,.8,.2,.5),i.setRange(1,.5),A.amp(i),F.amp(i),b.amp(i),k.amp(i);const W=new p5.FFT,K=(new p5.Amplitude,document.getElementById("btn")),X=document.getElementById("audioIcon"),Z=document.getElementById("spectrum"),ee=Z.getContext("2d"),te=document.getElementById("infoCount"),ne=document.getElementById("histogram"),se=document.getElementById("avgIncome"),ae=document.getElementById("stdDevIncome"),ce=document.getElementById("totalAggIncome"),de=document.getElementById("avgBinCount");w.addEventListener("change",()=>{w.checked&&($.sequence=u,T({elements:y,pattern:u}))}),I.addEventListener("change",()=>{I.checked&&(G.sequence=m,T({elements:h,pattern:m}))}),C.addEventListener("change",()=>{C.checked&&(V.sequence=p,T({elements:g,pattern:p}))});const re=new e({portalItem:{id:"936d99f8b69246d28d6deed9461d82f7"}});re.load().then(()=>{const e=re.layers.getItemAt(0);return e.outFields=["HINCBASECY","AGGHINC_CY","AVGHINC_CY","TOTHU_CY"],e}).then(()=>{const e=new t({map:re,container:"viewDiv"}),l=new n({content:new s({view:e})}),i=new r({container:"slider-container",excludedBarColor:"#524e4e",rangeType:"between"});e.ui.add(K,"top-left"),e.ui.add(l,"top-left"),e.ui.add(Z,"bottom-right"),e.ui.add("audioList","top-left"),e.ui.add("infoDiv","top-right"),e.ui.add(new n({content:ne}),"bottom-left"),i.labelFormatFunction=(e,t)=>"value"===t?`$${e.toFixed(0)}`:e,i.on("thumb-drag",e=>{const[t,n]=i.values,s=(n-t)/n;v.checked&&j.process(F,.12,s,n-t),B.checked&&z.process(k,.12,s,n-t),P.checked&&J.process(b,.12,s,n-t),S.checked&&Q.process(A,.12,s,n-t)}),v.addEventListener("change",e=>{v.checked?j=new p5.Delay:(j.disconnect(),j.dispose())}),B.addEventListener("change",e=>{B.checked?z=new p5.Delay:(z.disconnect(),z.dispose())}),P.addEventListener("change",e=>{P.checked?J=new p5.Delay:(J.disconnect(),J.dispose())}),S.addEventListener("change",e=>{S.checked?Q=new p5.Delay:(Q.disconnect(),Q.dispose())});const D=["AGGHINC_CY","HINC0_CY","HINC15_CY","HINC25_CY","HINC35_CY","HINC50_CY","HINC75_CY","HINC100_CY","HINC150_CY","HINC200_CY"];e.when(()=>{const t=re.layers.getItemAt(0);return e.whenLayerView(t)}).then(e=>(o=e,a.whenFalseOnce(o,"updating"))).then(()=>{e.on(["click","drag"],t=>{t.stopPropagation();const n=o.layer.createQuery();n.geometry=e.toMap(t),n.distance=5,n.units="kilometers";const s=n.clone(),a=D.map(e=>({onStatisticField:e,outStatisticFieldName:`Avg_${e}`,statisticType:"avg"})),r=D.map(e=>({onStatisticField:e,outStatisticFieldName:`Var_${e}`,statisticType:"var"})),l=D.map(e=>({onStatisticField:e,outStatisticFieldName:`StdDev_${e}`,statisticType:"stddev"}));s.outStatistics=[...a,...r,...l,{onStatisticField:"HINCBASECY",outStatisticFieldName:"Count_Est_Total",statisticType:"count"}],o.queryFeatures(s).then(({features:e})=>{if(!e.length)return;const t=e[0].attributes,{Count_Est_Total:n}=t;if(!n)return;U.setBPM(n);const[s,...a]=D,c=a.reduce((e,n)=>e+t[`StdDev_${n}`],0)/9,d=a.reduce((e,n)=>e+t[`Avg_${n}`],0)/9;u=a.map(e=>t[`Avg_${e}`]>d?1:0),p=a.map(e=>t[`StdDev_${e}`]>c?1:0),m=[];for(let e=0;e<9;e++){const t=u[e],n=p[e];let s=0;0===t&&0===n&&(s=1),m.push(s)}w.checked&&($.sequence=u,T({elements:y,pattern:u})),C.checked&&(V.sequence=p,T({elements:g,pattern:p})),I.checked&&(G.sequence=m,T({elements:h,pattern:m})),te.innerText=n,se.innerText=d.toFixed(1),ae.innerText=c.toFixed(1)});let v=null;const B={layer:o.layer,field:"AGGHINC_CY",numBins:9,features:[]};o.queryFeatures(n).then(({features:e})=>{if(e.length)return B.features=e,function(e){return d(e).then(({avg:e})=>e)}(B)}).then(e=>(v=e,c(B))).then(e=>{if(!e)return;const{bins:t,minValue:n,maxValue:s}=e;ce.innerText=_.format(s),i.set({average:v,bins:t,min:n,max:s,values:[n,s]});const a=t.reduce((e,t)=>e+t.count,0)/t.length,c=t.map(e=>e.count>a?1:0);de.innerText=a.toFixed(1),R.sequence=c,E.checked&&T({elements:f,pattern:c})}).catch(e=>console.warn(e)),o.queryObjectIds(n).then(e=>{e.length?o.effect={filter:{where:`OBJECTID in (${e.join(",")})`},excludedEffect:"grayscale(100%) opacity(30%)"}:o.effect=null})})}),K.addEventListener("click",()=>{F.isLoaded()&&k.isLoaded()&&A.isLoaded()&&(U.isPlaying?(console.log("stop music"),X.src="assets/speaker_Icon.svg",U.stop()):(console.log("start music"),X.src="assets/speaker_mute_Icon.svg",U.loop()))});let N=0;!function e(){const t=W.analyze();N=requestAnimationFrame(e),ee.fillStyle="rgb(255, 255, 255)",ee.fillRect(0,0,300,100);let n,s=0;for(let e=0;e<1024;e++)n=t[e]/2,ee.fillStyle="rgb("+(n+100)+",50,50)",ee.fillRect(s,100-n/2,.732421875,n),s+=1.732421875}()})}}));
