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
    "esri/Map",
    // View
    "esri/views/MapView",
    // Layers
    "esri/layers/GeoJSONLayer",
    // Widgets
    "esri/widgets/TimeSlider",
    "esri/widgets/Expand",
    "esri/widgets/Legend"
  ], function(Map, MapView, GeoJSONLayer, TimeSlider, Expand, Legend) {
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
    bPat = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
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
    const img = document.getElementById("audioIcon");
    const layer = new GeoJSONLayer({
      url:
        "https://bsvensson.github.io/various-tests/geojson/usgs-earthquakes-06182019.geojson",
      copyright: "USGS Earthquakes",
      title: "USGS Earthquakes",
      // set the CSVLayer's timeInfo based on the date field
      timeInfo: {
        startField: "time", // name of the date field
        interval: {
          // set time interval to one day
          unit: "days",
          value: 1
        }
      },
      renderer: {
        type: "simple",
        field: "mag",
        symbol: {
          type: "simple-marker",
          color: "orange",
          outline: null
        },
        visualVariables: [
          {
            type: "size",
            field: "mag",
            stops: [
              {
                value: 1,
                size: "5px"
              },
              {
                value: 2,
                size: "15"
              },
              {
                value: 3,
                size: "35"
              }
            ]
          },
          {
            type: "color",
            field: "depth",
            stops: [
              {
                value: 2.5,
                color: "#F9C653",
                label: "<2km"
              },
              {
                value: 3.5,
                color: "#F8864D",
                label: "3km"
              },
              {
                value: 4,
                color: "#C53C06",
                label: ">4km"
              }
            ]
          }
        ]
      },
      popupTemplate: {
        title: "{title}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              {
                fieldName: "place",
                label: "Location",
                visible: true
              },
              {
                fieldName: "mag",
                label: "Magnitude",
                visible: true
              },
              {
                fieldName: "depth",
                label: "Depth",
                visible: true
              }
            ]
          }
        ]
      }
    });

    const map = new Map({
      basemap: "dark-gray-vector",
      layers: [layer]
    });

    var view = new MapView({
      map: map,
      container: "viewDiv",
      zoom: 13,
      center: [-117.50268, 34.04713]
    });

    // create a new time slider widget
    // set other properties when the layer view is loaded
    // by default timeSlider.mode is "time-window" - shows
    // data falls within time range
    timeSlider = new TimeSlider({
      container: "timeSlider",
      playRate: 50,
      stops: {
        interval: {
          value: 1,
          unit: "hours"
        }
      }
    });
    view.ui.add(timeSlider, "manual");
    view.ui.add(btn, "top-left");
    view.ui.add("audioList", "top-left");

    // wait till the layer view is loaded
    view.whenLayerView(layer).then(function(lv) {
      layerView = lv;

      // start time of the time slider - 5/25/2019
      const start = new Date(2019, 4, 25);
      // set time slider's full extent to
      // 5/25/5019 - until end date of layer's fullTimeExtent
      timeSlider.fullTimeExtent = {
        start: start,
        end: layer.timeInfo.fullTimeExtent.end
      };

      // We will be showing earthquakes with one day interval
      // when the app is loaded we will show earthquakes that
      // happened between 5/25 - 5/26.
      const end = new Date(start);
      // end of current time extent for time slider
      // showing earthquakes with one day interval
      end.setDate(end.getDate() + 1);

      // Values property is set so that timeslider
      // widget show the first day. We are setting
      // the thumbs positions.
      timeSlider.values = [start, end];
    });

    // watch for time slider timeExtent change
    timeSlider.watch("timeExtent", () => {
      // only show earthquakes happened up until the end of
      // timeSlider's current time extent.
      layer.definitionExpression =
        "time <= " + timeSlider.timeExtent.end.getTime();

      // now gray out earthquakes that happened before the time slider's current
      // timeExtent... leaving footprint of earthquakes that already happened
      layerView.effect = {
        filter: {
          timeExtent: timeSlider.timeExtent,
          geometry: view.extent
        },
        excludedEffect: "grayscale(20%) opacity(12%)"
      };

      // run statistics on earthquakes fall within the current time extent
      const statQuery = layerView.effect.filter.createQuery();
      statQuery.outStatistics = [
        magMax,
        magAvg,
        magMin,
        tremorCount,
        avgDepth
      ];

      layer
        .queryFeatures(statQuery)
        .then((result) => {
          let htmls = [];
          statsDiv.innerHTML = "";
          if (result.error) {
            return result.error;
          } else {
            // Max_magnitude 1.55
            // Average_magnitude 0.8914285714285716
            // Min_magnitude 0.59
            // Average_depth 3.9200000000000004
            // delay.process(clap, 0.12, 0.8, 1000);
            if (result.features.length >= 1 && result.features[0].attributes["tremor_count"] > 0) {
              const attributes = result.features[0].attributes;
              const maxMag = attributes["Max_magnitude"];
              const minMag = attributes["Min_magnitude"];
              const avgMag = attributes["Average_magnitude"];
              const tremorCount = attributes["tremor_count"];
              const lowPass = maxMag * 1000;
              const feedback = minMag > 1 ? 0.9 : minMag;
              const delayTime = avgMag * 0.10;
              for (let name in statsFields) {
                if (attributes[name] && attributes[name] != null) {
                  const html =
                    "<br/>" +
                    statsFields[name] +
                    ": <b><span> " +
                    attributes[name].toFixed(2) +
                    "</span></b>";
                  htmls.push(html);
                }
              }
              delay.process(hh, delayTime, feedback, lowPass);
              delay.process(clap, delayTime, feedback, lowPass);
              delay.process(snare, delayTime, feedback, lowPass);
              // delay.process(bass, delayTime, feedback, lowPass);
              drums.setBPM(tremorCount);
              var yearHtml =
                "<span>" +
                result.features[0].attributes["tremor_count"] +
                "</span> earthquakes were recorded between " +
                timeSlider.timeExtent.start.toLocaleDateString() +
                " - " +
                timeSlider.timeExtent.end.toLocaleDateString() +
                ".<br/>";

              if (htmls[0] == undefined) {
                statsDiv.innerHTML = yearHtml;
              } else {
                statsDiv.innerHTML =
                  yearHtml + htmls[0] + htmls[1] + htmls[2] + htmls[3];
              }
            }
          }
        })
        .catch(function(error) {
          console.log(error);
        });
    });

    const avgDepth = {
      onStatisticField: "depth",
      outStatisticFieldName: "Average_depth",
      statisticType: "avg"
    };

    const magMax = {
      onStatisticField: "mag",
      outStatisticFieldName: "Max_magnitude",
      statisticType: "max"
    };

    const magAvg = {
      onStatisticField: "mag",
      outStatisticFieldName: "Average_magnitude",
      statisticType: "avg"
    };

    const magMin = {
      onStatisticField: "mag",
      outStatisticFieldName: "Min_magnitude",
      statisticType: "min"
    };

    const tremorCount = {
      onStatisticField: "mag",
      outStatisticFieldName: "tremor_count",
      statisticType: "count"
    };

    const statsFields = {
      Max_magnitude: "Max magnitude",
      Average_magnitude: "Average magnitude",
      Min_magnitude: "Min magnitude",
      Average_depth: "Average Depth"
    };

    // add a legend for the earthquakes layer
    const legendExpand = new Expand({
      collapsedIconClass: "esri-icon-collapse",
      expandIconClass: "esri-icon-expand",
      expandTooltip: "Legend",
      view: view,
      content: new Legend({
        view: view
      }),
      expanded: false
    });
    view.ui.add(legendExpand, "top-left");

    const statsDiv = document.getElementById("statsDiv");
    const infoDiv = document.getElementById("infoDiv");
    const infoDivExpand = new Expand({
      collapsedIconClass: "esri-icon-collapse",
      expandIconClass: "esri-icon-expand",
      expandTooltip: "Expand earthquakes info",
      view: view,
      content: infoDiv,
      expanded: true
    });
    view.ui.add(infoDivExpand, "top-right");
    
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
  });
}
