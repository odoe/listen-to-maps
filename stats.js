let hh, clap, bass, snare; // INSTRUMENT
let hPat, cPat, bPat, sPat; // INSTRUMENT PATTERN
let hPhrase, cPhrase, bPhrase, sPhrase; // INSTRUMENT PHRASE
let drums; // PART

let delay;
let fft;
let reverb;

let attackLevel = 1.0;
let releaseLevel = 0.5;

let attackTime = 0.01;
let decayTime = 0.8;
let susPercent = 0.2;
let releaseTime = 0.5;

let env;
let analyser;

let avgPattern = [];
let avgShiftedPattern = [];
let stdDevPattern = [];

const WIDTH = 300;
const HEIGHT = 100;
const STEPS = 9;

let beat = 1;

// pattern elements
const hhElements = Array.from(document.querySelectorAll(".hhP"));
const clapElements = Array.from(document.querySelectorAll(".clapP"));
const snareElements = Array.from(document.querySelectorAll(".snareP"));
const bassElements = Array.from(document.querySelectorAll(".bassP"));

// pattern toggle
const hPatInput = document.getElementById("hhPattern");
const cPatInput = document.getElementById("cPattern");
const sPatInput = document.getElementById("sPattern");
const bPatInput = document.getElementById("bPattern");

// delay elements
const hhDelay = document.getElementById("hhDelay");
const cDelay = document.getElementById("clapDelay");
const sDelay = document.getElementById("snareDelay");
const bDelay = document.getElementById("bassDelay");

// -----------------------------
// setup() is used by p5
// -----------------------------
function setup() {
  createCanvas(1, 1);
  
  require([
    // Map
    "esri/WebMap",
    // View
    "esri/views/MapView",
    // Widgets
    "esri/widgets/Expand",
    "esri/widgets/Legend",
    // utils
    "esri/core/watchUtils",
    "esri/renderers/smartMapping/statistics/histogram",
    "esri/renderers/smartMapping/statistics/summaryStatistics",
    "esri/widgets/HistogramRangeSlider"
  ], function(WebMap, MapView, Expand, Legend, watchUtils, histogram, summaryStatistics, HistogramRangeSlider) {
    let layerView;
    let timeSlider;

    // sound list
    const hhOn = document.getElementById("hh");
    const clapOn = document.getElementById("clap");
    const bassOn = document.getElementById("bass");
    const snareOn = document.getElementById("snare");

    // -----------------------------
    // p5 set up
    // -----------------------------

    hh = loadSound('assets/hh_sample.mp3', () => {});
    clap = loadSound('assets/clap_sample.mp3', () => {});
    bass = loadSound('assets/bass_sample.mp3', () => {});
    snare = loadSound('assets/snare_ups_sample.mp3', () => {});

  
    hPat = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
    cPat = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0];
    bPat = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0];
    sPat = [0, 1, 0, 0, 0, 1, 0, 0, 1, 0];

    drawPattern({
      elements: hhElements,
      pattern: hPat
    });
    drawPattern({
      elements: clapElements,
      pattern: cPat
    });
    drawPattern({
      elements: snareElements,
      pattern: sPat
    });
    drawPattern({
      elements: bassElements,
      pattern: bPat
    });
  
    hPhrase = new p5.Phrase('hh', (time) => {
      if(!hhOn.checked) {
        return;
      }
      env.play();
      hh.play(time);
    }, hPat);
    
    cPhrase = new p5.Phrase('clap', (time) => {
      if(!clapOn.checked) {
        return;
      }
      clap.play(time);
    }, cPat);
    
    let count = 0;
    bPhrase = new p5.Phrase('bass', (time) => {
      if(!bassOn.checked) {
        return;
      }
      env.play();
      bass.play(time);
      if (layerView && layerView.effect) {
        const effect = layerView.effect.clone();
        if (timeSlider && timeSlider.viewModel.state === "playing") {
          effect.includedEffect = 'contrast(500%)';
        }
        else {
          if (count === 0) {
            effect.includedEffect = 'contrast(500%)';
            count = 1;
          }
          else {
            effect.includedEffect = null;
            count = 0;
          }
        }

        layerView.effect = effect;
      }
    }, bPat);
  
    sPhrase = new p5.Phrase('snare', (time) => {
      if(!snareOn.checked) {
        return;
      }
      env.play();
      snare.play(time);
    }, sPat);

    drums = new p5.Part();
  
    drums.addPhrase(hPhrase);
    drums.addPhrase(cPhrase);
    drums.addPhrase(bPhrase);
    drums.addPhrase(sPhrase);

    delay = new p5.Delay() 
    
    drums.setBPM('60');
    
    reverb = new p5.Reverb();
    reverb.process(hh, 3, 2);
    reverb.process(snare, 3, 2);
    reverb.process(clap, 3, 2);
  
    env = new p5.Envelope();
    env.setADSR(attackTime, decayTime, susPercent, releaseTime);
    env.setRange(attackLevel, releaseLevel);
    
    bass.amp(env);
    hh.amp(env);
    snare.amp(env);
    clap.amp(env);

    fft = new p5.FFT();
    analyser = new p5.Amplitude();

    // -----------------------------
    // Mapping Set Up
    // -----------------------------
    const btn = document.getElementById("btn");
    const img = document.getElementById("audioIcon");
    const canvasSpectrum = document.getElementById("spectrum");
    const canvasCtx = canvasSpectrum.getContext("2d");
    const infoCount = document.getElementById("infoCount");
    const histogramElement = document.getElementById("histogram");

    // update patterns on check
    hPatInput.addEventListener("change", () => {
      if (hPatInput.checked) {
        hPhrase.sequence = avgPattern;
        drawPattern({
          elements: hhElements,
          pattern: avgPattern
        });
      }
    });
    cPatInput.addEventListener("change", () => {
      if (cPatInput.checked) {
        cPhrase.sequence = avgShiftedPattern;
        drawPattern({
          elements: clapElements,
          pattern: avgShiftedPattern
        });
      }
    });
    sPatInput.addEventListener("change", () => {
      if (sPatInput.checked) {
        sPhrase.sequence = stdDevPattern;
        drawPattern({
          elements: snareElements,
          pattern: stdDevPattern
        });
      }
    });

    const webmap = new WebMap({
      portalItem: {
        id: "5b353dd100b5497e9274b42d78f9ff55"
      }
    });

    webmap.load().then(() => {
      const layer = webmap.layers.getItemAt(0);
      layer.outFields = [
        "AGGINC_CY",
        "HINCBASECY",
        "TOTHU_CY"
      ];
      return layer;
    }).then(() => {

      const view = new MapView({
        map: webmap,
        container: "viewDiv",
        // zoom: 8,
        // center: [-74.0060, 40.7128]
      });
  
      // widgets
      const legendExpand = new Expand({
        content: new Legend({ view })
      });
      const histogramWidget = new HistogramRangeSlider({
        container: "slider-container",
        excludedBarColor: "#524e4e",
        rangeType: "between",
      });
  
      view.ui.add(btn, "top-left");
      view.ui.add(legendExpand, "top-left");
      view.ui.add(canvasSpectrum, "bottom-right");
      view.ui.add("audioList", "top-left");
      view.ui.add("infoDiv", "top-right");
      view.ui.add(histogramElement, "bottom-left");
  
      histogramWidget.on(["value-change", "values-change"], (event) =>{
        const [min, max] = histogramWidget.values;
        const pct = (max - min)/max;
        if (hhDelay.checked) {
          delay.process(hh, 0.12, pct, max - min);
        }
        if (cDelay.checked) {
          delay.process(clap, 0.12, pct, max - min);
        }
        if (sDelay.checked) {
          delay.process(snare, 0.12, pct, max - min);
        }
        if (bDelay.checked) {
          delay.process(bass, 0.12, pct, max - min);
        }
      });
  
      // fields of interest
      const fieldNames = [
        "HINCBASECY",
        "HINC0_CY",
        "HINC15_CY",
        "HINC25_CY",
        "HINC35_CY",
        "HINC50_CY",
        "HINC75_CY",
        "HINC100_CY",
        "HINC150_CY",
        "HINC200_CY"
      ];
      // stats types: count | sum | min | max | avg | stddev | var
  
      // set up layers and layer views
      view.when(() => {
        const layer = webmap.layers.getItemAt(0);
        return view.whenLayerView(layer);
      })
      .then((lyrView) => {
        layerView = lyrView;
        return watchUtils.whenFalseOnce(layerView, "updating");
      })
      .then(() => {
        view.on(["click", "drag"], (event)=> {
          // disables navigation by pointer drag
          event.stopPropagation();
          // stats queries
          const query = layerView.layer.createQuery();
          query.geometry = view.toMap(event); // converts the screen point to a map point
          query.distance = 5; // queries all features within 5 miles of the point
          query.units = "kilometers";
  
          // Prepare Query
  
          // pattern calc
          const patternQuery = query.clone();
  
          // -----------------------------
          // Statistics
          // -----------------------------
  
          // get an average of values
          const avgStats = fieldNames.map(field => ({
            onStatisticField: field,
            outStatisticFieldName: `Avg_${field}`,
            statisticType: "avg"
          }));
          // to get an average of the variances
          const varStats = fieldNames.map(field => ({
            onStatisticField: field,
            outStatisticFieldName: `Var_${field}`,
            statisticType: "var"
          }));
          // to get an above or below
          const stddevStats = fieldNames.map(field => ({
            onStatisticField: field,
            outStatisticFieldName: `StdDev_${field}`,
            statisticType: "stddev"
          }));
          patternQuery.outStatistics = [
            ...avgStats,
            ...varStats,
            ...stddevStats,
            // to get the total count
            {
              onStatisticField: "HINCBASECY",
              outStatisticFieldName: "Count_Est_Total",
              statisticType: "count"
            }
          ];
          layerView.queryFeatures(patternQuery).then(({ features }) => {
            if (!features.length) {
              return;
            }
            const attr = features[0].attributes;
            const {
              Avg_HINCBASECY,
              Count_Est_Total,
            } = attr;
            if (!Count_Est_Total) return;
            drums.setBPM(Count_Est_Total);
            // delay.process(hh, 0.5, 0.3, Avg_Estimate_Total);
            // delay.process(clap, 0.12, 0.8, Avg_Estimate_Total);
            // delay.process(snare, 0.1, 0.6, Avg_Estimate_Total);
            // delay.process(bass, 0.1, 0.6, Avg_Estimate_Total);
            const total = Avg_HINCBASECY / STEPS;
            const [_, ...names] = fieldNames;
            const totalStdDev = names.reduce((a, b) => a + attr[`StdDev_${b}`], 0);
            const avgStdDev = totalStdDev / STEPS;
            avgPattern = names.map(field => attr[`Avg_${field}`] > total ? 1 : 0);
            stdDevPattern = names.map(field => attr[`StdDev_${field}`] > avgStdDev ? 1 : 0);
            avgShiftedPattern = [];
            // xor of both avg and stddev
            for (let i = 0; i < STEPS; i++) {
              const a = avgPattern[i];
              const b = stdDevPattern[i];
              let c = 0;
              // fill the gaps
              if (a === 0 && b === 0) {
                c = 1;
              }
              avgShiftedPattern.push(c);
            }
  
            // avgShiftedPattern = avgPattern.map(a => a ^= 1);
  
            // hh pattern
            if (hPatInput.checked) {
              hPhrase.sequence = avgPattern;
              drawPattern({
                elements: hhElements,
                pattern: avgPattern
              });
            }
            // snare pattern
            if (sPatInput.checked) {
              sPhrase.sequence = stdDevPattern;
              drawPattern({
                elements: snareElements,
                pattern: stdDevPattern
              });
            }
            // clap pattern
            if (cPatInput.checked) {
              cPhrase.sequence = avgShiftedPattern;
              drawPattern({
                elements: clapElements,
                pattern: avgShiftedPattern
              });
            }
  
            infoCount.innerText = Count_Est_Total;
          });
  
          // Test histogram stuff
          let average = null;
          const params = {
            layer: layerView.layer,
            field: "AGGINC_CY",
            numBins: STEPS
          };
          layerView.queryFeatures(query).then(({ features }) => {
            if (features.length) {
              params.features = features;
              return getAverage(params);
            }
          })
          .then(avg => {
            average = avg;
            return histogram(params);
          })
          .then((histogramResult) => {
            if (!histogramResult) return;
            const { bins, minValue, maxValue } = histogramResult;
            histogramWidget.set({
              average,
              bins,
              min: minValue,
              max: maxValue,
              values: [ minValue, maxValue ]
            });
            const avgCount = bins.reduce((a, b) => a + b.count, 0) / bins.length;
            const bassPattern = bins.map(x => x.count > avgCount ? 1 : 0);
            bPhrase.sequence = bassPattern;
            if (bPatInput.checked) {
              drawPattern({
                elements: bassElements,
                pattern: bassPattern
              });
            }
          })
          .catch(error => console.warn(error));
  
          layerView.queryObjectIds(query).then(oids => {
            if (!oids.length) {
              // reset layerView effect
              layerView.effect = null;
              return;
            }
  
            layerView.effect = {
              filter: {
                where: `OBJECTID in (${ oids.join(',') })`
              },
              excludedEffect: "grayscale(100%) opacity(30%)"
            }
          });
        });
      });
  
      btn.addEventListener("click", () => {
        if (hh.isLoaded() && clap.isLoaded() && bass.isLoaded()) {
          if (!drums.isPlaying) {
            console.log("start music");
            img.src = "assets/speaker_mute_Icon.svg";
            drums.loop();
          } else {
            console.log("stop music");
            img.src = "assets/speaker_Icon.svg";
            drums.stop();
          }
        }
      });
  
      function getAverage(params) {
        return summaryStatistics(params).then(({ avg }) => avg);
      }
  
      function draw() {
        let dataArray = fft.analyze();
        drawVisual = requestAnimationFrame(draw);
        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        const barWidth = (WIDTH / 1024) * 2.5;
        let barHeight;
        var x = 0;
        for(var i = 0; i < 1024; i++) {
          barHeight = dataArray[i]/2;
          canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
          canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight);
          x += barWidth + 1;
        }
      }
  
      draw();
    });
  });
}

function drawPattern({ elements, pattern }) {
  for (let i in elements) {
    const element = elements[i];
    element.classList.remove("is-active");
    if (pattern[i]) {
      element.classList.add("is-active");
    }
  }
}
