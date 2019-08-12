let hh, clap, bass, snare; // INSTRUMENT
let hPat, cPat, bPat, sPat; // INSTRUMENT PATTERN
let hPhrase, cPhrase, bPhrase, sPhrase; // INSTRUMENT PHRASE
let drums; // PART

let delay;
let filter;
let fft;
let reverb;

let attackLevel = 1.0;
let releaseLevel = 0.5;

let attackTime = 0.01;
let decayTime = 0.8;
let susPercent = 0.2;
let releaseTime = 0.5;

var env;

function setup() {
  createCanvas(1, 1);
  
  require([
    // Map
    "esri/WebMap",
    // View
    "esri/views/MapView",
    // Widgets
    "esri/widgets/TimeSlider",
    "esri/widgets/Expand",
    "esri/widgets/Legend",
    // utils
    "esri/core/watchUtils"
  ], function(WebMap, MapView, TimeSlider, Expand, Legend, watchUtils) {
    let layerView;
    let timeSlider;
    // sound list
    const hhOn = document.getElementById("hh");
    const clapOn = document.getElementById("clap");
    const bassOn = document.getElementById("bass");
    const snareOn = document.getElementById("snare");

    // p5 setup
    hh = loadSound('assets/hh_sample.mp3', () => {});
    clap = loadSound('assets/clap_sample.mp3', () => {});
    bass = loadSound('assets/bass_sample.mp3', () => {});
    snare = loadSound('assets/snare_ups_sample.mp3', () => {});
  
    hPat = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
    cPat = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0];
    bPat = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
    sPat = [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0];
  
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
          effect.includedEffect = 'hue-rotate(30deg) contrast(500%)';
        }
        else {
          if (count === 0) {
            effect.includedEffect = 'hue-rotate(30deg) contrast(500%)';
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
    
    delay.process(hh, 0.5, 0.3, 1500);
    delay.process(clap, 0.12, 0.8, 1000);
    delay.process(snare, 0.1, 0.6, 2000);
    
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

    // arcgis mapping set up
    const btn = document.getElementById("btn");
    const hh25 = document.getElementById("hh25");
    const hh50 = document.getElementById("hh50");
    const hh100 = document.getElementById("hh100");
    const hh100more = document.getElementById("hh100more");

    const webmap = new WebMap({
      portalItem: {
        id: "d5dda743788a4b0688fe48f43ae7beb9"
      }
    });

    var view = new MapView({
      map: webmap,
      container: "viewDiv",
      zoom: 8,
      center: [-74.0060, 40.7128]
    });

    // widgets
    const legendExpand = new Expand({
      content: new Legend({ view })
    });

    view.ui.add(btn, "top-left");
    view.ui.add(legendExpand, "top-left");

    // fields of interest
    const fieldNames = [
      "Estimate_Total",
      "Estimate_Total_10000to14999",
      "Estimate_Total_15000to19999",
      "Estimate_Total_20000to24999",
      "Estimate_Total_25000to29999",
      "Estimate_Total_30000to34999",
      "Estimate_Total_35000to39999",
      "Estimate_Total_40000to44999",
      "Estimate_Total_45000to49999",
      "Estimate_Total_50000to59999",
      "Estimate_Total_60000to74999",
      "Estimate_Total_75000to99999",
      "Estimate_Total_100000to124999",
      "Estimate_Total_125000to149999",
      "Estimate_Total_150000to199999",
      "Estimate_Total_200000ormore",
      "Estimate_Total_Lessthan10000"
    ];
    // stats types: count | sum | min | max | avg | stddev | var
    const countEstTotal = {
      onStatisticField: "Estimate_Total",
      outStatisticFieldName: "Count_Est_Total",
      statisticType: "count"
    };
    const sumEstTotal = {
      onStatisticField: "Estimate_Total",
      outStatisticFieldName: "Sum_Est_Total",
      statisticType: "sum"
    };
    const minEstTotal = {
      onStatisticField: "Estimate_Total",
      outStatisticFieldName: "Min_Est_Total",
      statisticType: "min"
    };
    const maxEstTotal = {
      onStatisticField: "Estimate_Total",
      outStatisticFieldName: "Max_Est_Total",
      statisticType: "max"
    };
    const avgEstTotal = {
      onStatisticField: "Estimate_Total",
      outStatisticFieldName: "Average_Est_Total",
      statisticType: "avg"
    };
    const stddevEstTotal = {
      onStatisticField: "Estimate_Total",
      outStatisticFieldName: "StdDev_Est_Total",
      statisticType: "stddev"
    };
    const varEstTotal = {
      onStatisticField: "Estimate_Total",
      outStatisticFieldName: "Var_Est_Total",
      statisticType: "var"
    };

    const statDefinitions = [
      countEstTotal, sumEstTotal, minEstTotal,
      maxEstTotal, avgEstTotal, stddevEstTotal,
      varEstTotal
    ];

    const hhElements = Array.from(document.querySelectorAll(".hhP"));

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
        // TODO: add definition expression to match filters
        query.geometry = view.toMap(event); // converts the screen point to a map point
        query.distance = 5; // queries all features within 5 miles of the point
        query.units = "miles";
        // const statsQuery = query.clone();
        // statsQuery.outStatistics = statDefinitions;

        // pattern calc
        const patternQuery = query.clone();
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
            onStatisticField: "Estimate_Total",
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
            Avg_Estimate_Total, // 1212.1666666666667
            Count_Est_Total, // 6
          } = attr;
          if (!Count_Est_Total) return;
          drums.setBPM(Count_Est_Total);
          // delay.process(hh, 0.5, 0.3, Avg_Estimate_Total);
          delay.process(clap, 0.12, 0.8, Avg_Estimate_Total);
          delay.process(snare, 0.1, 0.6, Avg_Estimate_Total);
          delay.process(bass, 0.1, 0.6, Avg_Estimate_Total);
          const total = attr["Avg_Estimate_Total"] / 16;
          const totalStdDev = fieldNames.reduce((a, b) => a + attr[`StdDev_${b}`], 0);
          // const avgStdDev = Math.sqrt(totalVars);
          const avgStdDev = totalStdDev / 16;
          const avgPattern = fieldNames.map(field => attr[`Avg_${field}`] > total ? 1 : 0);
          const stdDevPattern = fieldNames.map(field => attr[`StdDev_${field}`] > avgStdDev ? 1 : 0);

          hPhrase.sequence = avgPattern;
          // sPhrase.sequence = avgPattern.map(a => a ^= 1);
          sPhrase.sequence = stdDevPattern;
          // console.log(hPhrase);
          // console.log(hPat);
          // console.log(hhElements);
          for (let i in hhElements) {
            const element = hhElements[i];
            element.classList.remove("is-active");
            if (avgPattern[i]) {
              element.classList.add("is-active");
            }
          }
        });

        layerView.queryObjectIds(query).then(oids => {
          if (!oids.length) {
            // reset layerView effect
            layerView.effect = null;
            return;
          }
          // console.log("response!!!", features);
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
          drums.loop();
        } else {
          console.log("stop music");
          drums.stop();
        }
      }
    });

  });
}
