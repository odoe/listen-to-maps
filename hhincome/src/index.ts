// styles
import './css/main.css';

// Map data
import WebMap from 'esri/WebMap';

// MapView
import MapView from 'esri/views/MapView';

// Widgets
import Expand from 'esri/widgets/Expand';
import Legend from 'esri/widgets/Legend';

// utils
import { debounce } from 'esri/core/promiseUtils';
import watchUtils from 'esri/core/watchUtils';
import histogram from 'esri/renderers/smartMapping/statistics/histogram';
import summaryStatistics from 'esri/renderers/smartMapping/statistics/summaryStatistics';
import HistogramRangeSlider from 'esri/widgets/HistogramRangeSlider';

const WEBMAP_ID = '936d99f8b69246d28d6deed9461d82f7';

const noop = () => {};

let reverb;

const attackLevel = 1.0;
const releaseLevel = 0.5;

const attackTime = 0.01;
const decayTime = 0.8;
const susPercent = 0.2;
const releaseTime = 0.5;

let env: any;
let avgPattern: number[] = [];
let avgShiftedPattern: number[] = [];
let stdDevPattern: number[] = [];

const WIDTH = 300;
const HEIGHT = 100;
const STEPS = 9;

// pattern elements
const hhElements = Array.from(document.querySelectorAll('.hhP'));
const clapElements = Array.from(document.querySelectorAll('.clapP'));
const snareElements = Array.from(document.querySelectorAll('.snareP'));
const bassElements = Array.from(document.querySelectorAll('.bassP'));

// pattern toggle
const hPatInput = document.getElementById('hhPattern') as HTMLInputElement;
const cPatInput = document.getElementById('cPattern') as HTMLInputElement;
const sPatInput = document.getElementById('sPattern') as HTMLInputElement;
const bPatInput = document.getElementById('bPattern') as HTMLInputElement;

// delay elements
const hhDelayInput = document.getElementById('hhDelay') as HTMLInputElement;
const cDelayInput = document.getElementById('clapDelay') as HTMLInputElement;
const sDelayInput = document.getElementById('snareDelay') as HTMLInputElement;
const bDelayInput = document.getElementById('bassDelay') as HTMLInputElement;

// number formatter
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

const hh = new p5.SoundFile('assets/808-open-hat-1.mp3', noop);
const clap = new p5.SoundFile('assets/808-clap.mp3', noop);
const bass = new p5.SoundFile('assets/processed-909.mp3', noop);
const snare = new p5.SoundFile('assets/808-snare-drum-1.mp3', noop);

const hPat = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
const cPat = [0, 0, 0, 1, 0, 0, 1, 0, 1, 0];
const bPat = [0, 1, 0, 1, 0, 1, 0, 1, 0, 0];
const sPat = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0];

window['setup'] = function setup() {
  window.createCanvas(1, 1);

  let layerView: __esri.FeatureLayerView;
  let timeSlider: HistogramRangeSlider;

  // sound list
  const hhOn = document.getElementById('hh') as HTMLInputElement;
  const clapOn = document.getElementById('clap') as HTMLInputElement;
  const bassOn = document.getElementById('bass') as HTMLInputElement;
  const snareOn = document.getElementById('snare') as HTMLInputElement;

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

  const hPhrase = new p5.Phrase(
    'hh',
    (time: number) => {
      if (!hhOn.checked) {
        return;
      }
      env.play();
      hh.play(time);
    },
    hPat
  );

  const cPhrase = new p5.Phrase(
    'clap',
    (time: number) => {
      if (!clapOn.checked) {
        return;
      }
      clap.play(time);
    },
    cPat
  );

  // const count = 0;
  const bPhrase = new p5.Phrase(
    'bass',
    (time: number) => {
      if (!bassOn.checked) {
        return;
      }
      env.play();
      bass.play(time);
      // if (layerView && layerView.effect) {
      //   const effect = layerView.effect.clone();
      //   if (timeSlider) {
      //     // && timeSlider.viewModel.state === 'playing'
      //     effect.includedEffect = 'contrast(500%)';
      //   } else {
      //     if (count === 0) {
      //       effect.includedEffect = 'contrast(500%)';
      //       count = 1;
      //     } else {
      //       effect.includedEffect = null as any;
      //       count = 0;
      //     }
      //   }

      //   layerView.effect = effect;
      // }
    },
    bPat
  );

  const sPhrase = new p5.Phrase(
    'snare',
    (time: number) => {
      if (!snareOn.checked) {
        return;
      }
      env.play();
      snare.play(time);
    },
    sPat
  );

  const drums = new p5.Part();

  drums.addPhrase(hPhrase);
  drums.addPhrase(cPhrase);
  drums.addPhrase(bPhrase);
  drums.addPhrase(sPhrase);

  let hhDelay = new p5.Delay();
  let cDelay = new p5.Delay();
  let sDelay = new p5.Delay();
  let bDelay = new p5.Delay();

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

  const fft = new p5.FFT();
  const analyser = new p5.Amplitude();

  // -----------------------------
  // Mapping Set Up
  // -----------------------------
  const btn = document.getElementById('btn') as HTMLButtonElement;
  const img = document.getElementById('audioIcon') as HTMLImageElement;
  const canvasSpectrum = document.getElementById('spectrum') as HTMLCanvasElement;
  const canvasCtx = canvasSpectrum.getContext('2d') as CanvasRenderingContext2D;
  const infoCount = document.getElementById('infoCount') as HTMLElement;
  const histogramElement = document.getElementById('histogram') as HTMLElement;
  const avgIncomeText = document.getElementById('avgIncome') as HTMLElement;
  const stdDevIncomeText = document.getElementById('stdDevIncome') as HTMLElement;
  const totalAggIncomeText = document.getElementById('totalAggIncome') as HTMLElement;
  const avgBinCountText = document.getElementById('avgBinCount') as HTMLElement;

  // update patterns on check
  hPatInput.addEventListener('change', () => {
    if (hPatInput.checked) {
      hPhrase.sequence = avgPattern;
      drawPattern({
        elements: hhElements,
        pattern: avgPattern
      });
    }
  });
  cPatInput.addEventListener('change', () => {
    if (cPatInput.checked) {
      cPhrase.sequence = avgShiftedPattern;
      drawPattern({
        elements: clapElements,
        pattern: avgShiftedPattern
      });
    }
  });
  sPatInput.addEventListener('change', () => {
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
      id: WEBMAP_ID
    }
  });

  const highlightMap = debounce((query: __esri.Query) => {
    return layerView.queryObjectIds(query).then(oids => {
      if (!oids.length) {
        // reset layerView effect
        layerView.effect = null as any;
        return;
      }

      layerView.effect = {
        filter: {
          where: `OBJECTID in (${oids.join(',')})`
        },
        excludedEffect: 'grayscale(100%) opacity(30%)'
      } as any;
      return query;
    });
  });

  webmap
    .load()
    .then(() => {
      const layer = webmap.layers.getItemAt(0) as __esri.FeatureLayer;
      layer.outFields = ['HINCBASECY', 'AGGHINC_CY', 'AVGHINC_CY', 'TOTHH_CY', 'MEDHINC_CY'];
      return layer;
    })
    .then(() => {
      const view = new MapView({
        map: webmap,
        container: 'viewDiv'
      });

      // widgets
      const legendExpand = new Expand({
        content: new Legend({ view })
      });
      const histogramWidget = new HistogramRangeSlider({
        container: 'slider-container',
        excludedBarColor: '#524e4e',
        rangeType: 'between'
      });

      view.ui.add(btn, 'top-left');
      view.ui.add(legendExpand, 'top-left');
      view.ui.add(canvasSpectrum, 'bottom-right');
      view.ui.add('audioList', 'top-left');
      view.ui.add('infoDiv', 'top-right');
      view.ui.add(
        new Expand({
          content: histogramElement
        } as any),
        'bottom-left'
      );

      histogramWidget.labelFormatFunction = (value, type) => {
        return type === 'value' ? `$${value.toFixed(0)}` : (value as any);
      };

      histogramWidget.on('thumb-drag', _ => {
        const [min, max] = histogramWidget.values;
        const pct = (max - min) / max;
        if (hhDelayInput.checked) {
          hhDelay.process(hh, 0.12, pct, max - min);
        }
        if (cDelayInput.checked) {
          cDelay.process(clap, 0.12, pct, max - min);
        }
        if (sDelayInput.checked) {
          sDelay.process(snare, 0.12, pct, max - min);
        }

        if (bDelayInput.checked) {
          bDelay.process(bass, 0.12, pct, max - min);
        }
      });

      hhDelayInput.addEventListener('change', event => {
        if (!hhDelayInput.checked) {
          hhDelay.disconnect();
          hhDelay.dispose();
        } else {
          hhDelay = new p5.Delay();
        }
      });

      cDelayInput.addEventListener('change', event => {
        if (!cDelayInput.checked) {
          cDelay.disconnect();
          cDelay.dispose();
        } else {
          cDelay = new p5.Delay();
        }
      });

      sDelayInput.addEventListener('change', event => {
        if (!sDelayInput.checked) {
          sDelay.disconnect();
          sDelay.dispose();
        } else {
          sDelay = new p5.Delay();
        }
      });

      bDelayInput.addEventListener('change', event => {
        if (!bDelayInput.checked) {
          bDelay.disconnect();
          bDelay.dispose();
        } else {
          bDelay = new p5.Delay();
        }
      });

      // fields of interest
      const fieldNames = [
        // 'AGGHINC_CY',
        'MEDHINC_CY', // Median HH Income

        'HINC0_CY',
        'HINC15_CY',
        'HINC25_CY',
        'HINC35_CY',
        'HINC50_CY',
        'HINC75_CY',
        'HINC100_CY',
        'HINC150_CY',
        'HINC200_CY'
      ];
      // stats types: count | sum | min | max | avg | stddev | var

      // set up layers and layer views
      let query: __esri.Query;
      view
        .when(() => {
          const layer = webmap.layers.getItemAt(0);
          return view.whenLayerView(layer);
        })
        .then(lyrView => {
          layerView = lyrView;
          query = layerView.layer.createQuery();
          query.distance = 5; // queries all features within 5 miles of the point
          query.units = 'kilometers';
          return watchUtils.whenFalseOnce(layerView, 'updating');
        })
        .then(() => {
          view.on(['click', 'drag'], event => {
            // disables navigation by pointer drag
            event.stopPropagation();
            // stats queries
            // const query = layerView.layer.createQuery();
            query.geometry = view.toMap(event); // converts the screen point to a map point
            return highlightMap(query).then(() => {
              // pattern calc
              const patternQuery = query.clone();

              // -----------------------------
              // Statistics
              // -----------------------------

              // get an average of values
              const avgStats = fieldNames.map(field => ({
                onStatisticField: field,
                outStatisticFieldName: `Avg_${field}`,
                statisticType: 'avg'
              }));
              // to get an average of the variances
              const varStats = fieldNames.map(field => ({
                onStatisticField: field,
                outStatisticFieldName: `Var_${field}`,
                statisticType: 'var'
              }));
              // to get an above or below
              const stddevStats = fieldNames.map(field => ({
                onStatisticField: field,
                outStatisticFieldName: `StdDev_${field}`,
                statisticType: 'stddev'
              }));
              patternQuery.outStatistics = [
                ...avgStats,
                ...varStats,
                ...stddevStats,
                // to get the total count
                {
                  onStatisticField: 'TOTHH_CY',
                  outStatisticFieldName: 'Count_Est_Total',
                  statisticType: 'count'
                }
              ] as any;
              layerView.queryFeatures(patternQuery).then(({ features }) => {
                if (!features.length) {
                  return;
                }
                const attr = features[0].attributes;
                const { Count_Est_Total } = attr;
                if (!Count_Est_Total) return;
                drums.setBPM(Count_Est_Total);
                const [_, ...names] = fieldNames;
                // std dev of houeholds
                const totalStdDev = names.reduce((a, b) => a + attr[`StdDev_${b}`], 0);
                const avgStdDev = totalStdDev / STEPS;
                // avg number of households
                const avgHH = names.reduce((a, b) => a + attr[`Avg_${b}`], 0) / STEPS;
                avgPattern = names.map(field => (attr[`Avg_${field}`] > avgHH ? 1 : 0));
                stdDevPattern = names.map(field => (attr[`StdDev_${field}`] > avgStdDev ? 1 : 0));
                avgShiftedPattern = [];
                // fill the gaps from avg and std dev
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
                avgIncomeText.innerText = avgHH.toFixed(1);
                stdDevIncomeText.innerText = avgStdDev.toFixed(1);
              });

              // histogram stuff
              let average: any = null;
              const params: {
                layer: __esri.FeatureLayer;
                field: string;
                numBins: number;
                features: any[];
              } = {
                layer: layerView.layer,
                field: 'AGGHINC_CY',
                numBins: STEPS,
                features: []
              };
              layerView
                .queryFeatures(query)
                .then(({ features }) => {
                  if (features.length) {
                    params.features = features;
                    return getAverage(params);
                  }
                })
                .then(avg => {
                  average = avg;
                  return histogram(params);
                })
                .then(histogramResult => {
                  if (!histogramResult) return;
                  const { bins, minValue, maxValue } = histogramResult;
                  totalAggIncomeText.innerText = formatter.format(maxValue);
                  histogramWidget.set({
                    average,
                    bins,
                    min: minValue,
                    max: maxValue,
                    values: [minValue, maxValue]
                  });
                  const avgCount = bins.reduce((a, b) => a + b.count, 0) / bins.length;
                  const bassPattern = bins.map(x => (x.count > avgCount ? 1 : 0));
                  avgBinCountText.innerText = avgCount.toFixed(1);
                  bPhrase.sequence = bassPattern;
                  if (bPatInput.checked) {
                    drawPattern({
                      elements: bassElements,
                      pattern: bassPattern
                    });
                  }
                })
                .catch(error => console.warn(error));
            });
          });
        });

      btn.addEventListener('click', () => {
        if (hh.isLoaded() && clap.isLoaded() && bass.isLoaded()) {
          if (!drums.isPlaying) {
            console.log('start music');
            img.src = 'assets/speaker_mute_Icon.svg';
            drums.loop();
          } else {
            console.log('stop music');
            img.src = 'assets/speaker_Icon.svg';
            drums.stop();
          }
        }
      });

      function getAverage(params: __esri.summaryStatisticsSummaryStatisticsParams) {
        return summaryStatistics(params).then(({ avg }) => avg);
      }

      let drawVisual = 0;
      function draw() {
        const dataArray = fft.analyze();
        drawVisual = requestAnimationFrame(draw);
        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        const barWidth = (WIDTH / 1024) * 2.5;
        let barHeight;
        let x = 0;
        for (let i = 0; i < 1024; i++) {
          barHeight = dataArray[i] / 2;
          canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
          canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);
          x += barWidth + 1;
        }
      }

      draw();
    });
};

function drawPattern({ elements, pattern }: { elements: Element[]; pattern: number[] }) {
  for (const i in elements) {
    const element = elements[i];
    element.classList.remove('is-active');
    if (pattern[i]) {
      element.classList.add('is-active');
    }
  }
}
