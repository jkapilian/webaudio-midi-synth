document.addEventListener("DOMContentLoaded", function(event) {

    WebMidi.enable(function (err) {
        if (err) console.log("An error occurred", err);
    
        WebMidi.inputs[0].addListener("noteon", "all", function (e) {
            const key = e.note.number;
            const vel = e.velocity;

            let loudness_mult = 1;

            if (midiToFreq(key) > 100) {
                loudness_mult = 0.8;
            }
            else {
                loudness_mult = 0.8 + (100 - midiToFreq(key)) * 0.002;
            }
            if (activeOscillators[key]) {
                // allow multiple attacks if sustain pedal held
                let type = wavePicker.options[wavePicker.selectedIndex].value;
                activeOscillators[key][0].envelope.gain.setValueAtTime(activeOscillators[key][0].envelope.gain.value, audioCtx.currentTime);
                activeOscillators[key][0].envelope.gain.linearRampToValueAtTime(vel * type_mult[type] * loudness_mult, audioCtx.currentTime + attack.value/1000);
                activeOscillators[key][0].envelope.gain.linearRampToValueAtTime(vel * type_mult[type] * loudness_mult * sustainEnv.value / 100, audioCtx.currentTime + attack.value/1000 + decay.value/1000);
            }
            else {
                pressedKeys[key] = true;
                playNote(key, vel);
            }
        });
    
        WebMidi.inputs[0].addListener("noteoff", "all", function (e) {
            const key = e.note.number;
            if (!sustain) {
                removeNote(key); // only release note if there's no sustain
            }
            pressedKeys[key] = false;
        });

        WebMidi.inputs[0].addListener("controlchange", "all", function (e) {
            for (let i = 0; i < midiActiveMap.length; i++) {
                if (midiActiveMap[i]) {
                    console.log("i " + i + " number " + e.controller.number);
                    midiMaps[i] = e.controller.number;
                    midiActiveMap[i] = false;
                    maps[i].style.backgroundColor = "#BBBBBB";
                }
            }
            
            // wave up
            if (e.controller.number == midiMaps[0] && e.value) {
                wavePicker.selectedIndex = (wavePicker.selectedIndex - 1);
                if (wavePicker.selectedIndex == -1) {
                    wavePicker.selectedIndex += wavePicker.options.length;
                }
            }
            // wave down
            if (e.controller.number == midiMaps[1] && e.value) {
                wavePicker.selectedIndex = (wavePicker.selectedIndex + 1) % wavePicker.options.length;
            }

            // patch up
             if (e.controller.number == midiMaps[2] && e.value) {
                patch.selectedIndex = (patch.selectedIndex - 1);
                if (patch.selectedIndex == -1) {
                    patch.selectedIndex += patch.options.length;
                }
                setPatch(patches[patch.value]);
            }
            // patch down
            if (e.controller.number == midiMaps[3] && e.value) {
                patch.selectedIndex = (patch.selectedIndex + 1) % patch.options.length;
                setPatch(patches[patch.value]);
            }

            // LFO check
            if (e.controller.number == midiMaps[4] && e.value) {
                lfo_select.checked = !lfo_select.checked;
                toggleLFO();
            }

            // LFO knob
            if (e.controller.number == midiMaps[5]) {
                let value = Math.round(e.value / 127 * 15.0); // LFO goes from 0-15 Hz
                lfoFreq.value = value;
                setLFO(value);
            }

            // additive check
            if (e.controller.number == midiMaps[6] && e.value) {
                additive.checked = !additive.checked;
            }

            // additive partials knob
            if (e.controller.number == midiMaps[7]) {
                let value = Math.round(e.value / 127 * 9.0) + 1; // partials go from 1 to 10
                partialsOutput.innerHTML = value;
                partials.value = value;
            }

            // AM check
            if (e.controller.number == midiMaps[8] && e.value) {
                am.checked = !am.checked;
            }

            // AM modulator freq knob
            if (e.controller.number == midiMaps[9]) {
                let value = Math.round(e.value / 127 * 1000.0); // LFO goes from 0-1000 Hz
                setAMFreq(value);
                amModulator.value = value;
            }

            // AM depth knob
            if (e.controller.number == midiMaps[10]) {
                let value = Math.round(e.value / 127 * 500); // depth goes from 0 to 0.5 (divided later)
                setAMDepth(value);
                amDepth.value = value;
            }

            // FM check
            if (e.controller.number == midiMaps[11] && e.value) {
                fm.checked = !fm.checked;
            }

            // FM modulator freq knob
            if (e.controller.number == midiMaps[12]) {
                let value = Math.round(e.value / 127 * 1000.0); // LFO goes from 0-1000 Hz
                setFMFreq(value);
                fmModulator.value = value;
            }

            // FM depth knob
            if (e.controller.number == midiMaps[13]) {
                let value = Math.round(e.value / 127 * 1000.0); // depth goes from 0-1000 Hz
                setFMDepth(value);
                fmDepth.value = value;
            }

            // attack
            if (e.controller.number == midiMaps[14]) {
                let value = Math.round(e.value / 127 * 100.0); // attack goes from 0-100 ms
                attack.value = value;
                attackOutput.innerHTML = value + " ms";
            }

            // decay
            if (e.controller.number == midiMaps[15]) {
                let value = Math.round(e.value / 127 * 10000.0); // decay goes from 0-10000 ms
                decay.value = value;
                decayOutput.innerHTML = value + " ms";
            }

            // sustain
            if (e.controller.number == midiMaps[16]) {
                let value = Math.round(e.value / 127 * 100.0); // sustain goes from 0.00-1.00
                sustainEnv.value = value;
                sustainOutput.innerHTML = (value/100).toFixed(2);
            }

            // relase
            if (e.controller.number == midiMaps[17]) {
                let value = Math.round(e.value / 127 * 100.0); // release goes from 0-100 ms
                release.value = value;
                releaseOutput.innerHTML = value + " ms";
            }

            // filter 1 type up
            if (e.controller.number == midiMaps[18] && e.value) {
                filterType1.selectedIndex = (filterType1.selectedIndex - 1);
                if (filterType1.selectedIndex == -1) {
                    filterType1.selectedIndex += filterType1.options.length;
                }
            }
            // filter 1 type down
            if (e.controller.number == midiMaps[19] && e.value) {
                filterType1.selectedIndex = (filterType1.selectedIndex + 1) % filterType1.options.length;
            }

            // filter 1 freq
            if (e.controller.number == midiMaps[20]) {
                let value = Math.round(e.value / 127 * 9990.0 + 1); // freq goes from 1-10000 Hz
                filterFreq1.value = value;
                setFilter1(value, "frequency");
            }

            // filter 1 velocity effect
            if (e.controller.number == midiMaps[21]) {
                let value = Math.round(e.value / 127 * 20.0 - 10); // vel effects goes from -10-10
                filterVel1.value = value;
                setFilter1(value, "vel");
            }

            // filter 1 gain
            if (e.controller.number == midiMaps[22]) {
                let value = Math.round(e.value / 127 * 80.0 - 40); // gain goes from -40-40
                filterGain1.value = value;
                setFilter1(value, "gain");
            }

            // filter 1 Q
            if (e.controller.number == midiMaps[23]) {
                let value = Math.round(e.value / 127 * 999.0 + 1); // Q goes from 1-1000
                filterQ1.value = value;
                setFilter1(value, "Q");
            }

            // filter 2 type up
            if (e.controller.number == midiMaps[24] && e.value) {
                filterType2.selectedIndex = (filterType2.selectedIndex - 1);
                if (filterType2.selectedIndex == -1) {
                    filterType2.selectedIndex += filterType2.options.length;
                }
            }
            // filter 2 type down
            if (e.controller.number == midiMaps[25] && e.value) {
                filterType2.selectedIndex = (filterType2.selectedIndex + 1) % filterType2.options.length;
            }

            // filter 2 freq
            if (e.controller.number == midiMaps[26]) {
                let value = Math.round(e.value / 127 * 9990.0 + 1); // freq goes from 1-10000 Hz
                filterFreq2.value = value;
                setFilter2(value, "frequency");
            }

            // filter 2 velocity effect
            if (e.controller.number == midiMaps[27]) {
                let value = Math.round(e.value / 127 * 20.0 - 10); // vel effects goes from -10-10
                filterVel2.value = value;
                setFilter2(value, "vel");
            }

            // filter 2 gain
            if (e.controller.number == midiMaps[28]) {
                let value = Math.round(e.value / 127 * 80.0 - 40); // gain goes from -40-40
                filterGain2.value = value;
                setFilter2(value, "gain");
            }

            // filter 2 Q
            if (e.controller.number == midiMaps[29]) {
                let value = Math.round(e.value / 127 * 999.0 + 1); // Q goes from 1-1000
                filterQ2.value = value;
                setFilter2(value, "Q");
            }



            if (e.controller.name == "holdpedal") {
                if (e.value) {
                    sustain = true;
                }
                else {
                    sustain = false;
                    for (let note in activeOscillators) {
                        if (!pressedKeys[note]) {
                            removeNote(note);
                        }
                    }
                }
            }
        });

        WebMidi.inputs[0].addListener("pitchbend", "all", function (e) {
            let freq = 440 + Math.round(25 * e.value);
            freqOutput.innerHTML = freq + " Hz";
            slider.value = freq;
            changeTuning(freq);
        });
    
    });

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const destination = audioCtx.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(destination.stream);
    let recording = false;
    let chunks = [];

    const biquadFilter1 = audioCtx.createBiquadFilter();

    biquadFilter1.type = "lowpass";
    biquadFilter1.frequency.setValueAtTime(10000, audioCtx.currentTime);
    biquadFilter1.gain.setValueAtTime(0, audioCtx.currentTime);

    const biquadFilter2 = audioCtx.createBiquadFilter();

    biquadFilter2.type = "lowpass";
    biquadFilter2.frequency.setValueAtTime(10000, audioCtx.currentTime);
    biquadFilter2.gain.setValueAtTime(0, audioCtx.currentTime);

    const globalGain = audioCtx.createGain();
    globalGain.gain.setValueAtTime(0.6, audioCtx.currentTime);
    globalGain.connect(biquadFilter1).connect(biquadFilter2).connect(audioCtx.destination);
    globalGain.connect(biquadFilter1).connect(biquadFilter2).connect(destination);

    const lfoDepth = audioCtx.createGain();
    lfoDepth.gain.setValueAtTime(0, audioCtx.currentTime);

    const midiToFreq = m => Math.pow(2, (m-69)/12) * 440;

    const type_mult = {
        "sine": 1.0,
        "sawtooth": 0.5,
        "square": 0.5,
        "triangle": 0.8,
    };
    
    activeOscillators = {};
    pressedKeys = {};
    numberOfOscillators = 0;

    midiMaps = [109, 110, 111, 112, 0, 37, 25, 16, 0, 0, 0, 0, 0, 0, 12, 13, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    midiActiveMap = Array(30).fill(false);

    let recordButton = document.getElementById("record");

    let wavePicker = document.querySelector("select[name='waveform']");
    let patch = document.querySelector("select[name='patch']");

    let additive = document.getElementById("additive");
    let am = document.getElementById("am");
    let fm = document.getElementById("fm");

    // let synthMode = document.querySelector("select[name='synth-mode']");

    let slider = document.getElementById("tuning");
    let freqOutput = document.getElementById("frequency");

    let partials = document.getElementById("partials");
    let partialsOutput = document.getElementById("partials-label");

    let amModulator = document.getElementById("am-modulator");
    let amModulatorOutput = document.getElementById("am-modulator-label");

    let amDepth = document.getElementById("am-depth");
    let amDepthOutput = document.getElementById("am-depth-label");

    let fmModulator = document.getElementById("fm-modulator");
    let fmModulatorOutput = document.getElementById("fm-modulator-label");

    let fmDepth = document.getElementById("fm-depth");
    let fmDepthOutput = document.getElementById("fm-depth-label");

    let lfo_select = document.getElementById("lfo");
    let lfoFreq = document.getElementById("lfo-freq");
    let lfoOutput = document.getElementById("lfo-label");

    let attack = document.getElementById("attack");
    let attackOutput = document.getElementById("attack-label");

    let decay = document.getElementById("decay");
    let decayOutput = document.getElementById("decay-label");

    let sustainEnv = document.getElementById("sustain");
    let sustainOutput = document.getElementById("sustain-label");
    
    let release = document.getElementById("release");
    let releaseOutput = document.getElementById("release-label");

    let filterType1 = document.getElementById("filter-1-type");
    
    let filterFreq1 = document.getElementById("filter-1-freq");
    let filterFreqOutput1 = document.getElementById("filter-1-freq-label");

    let filterVel1 = document.getElementById("filter-1-vel");
    let filterVelOutput1 = document.getElementById("filter-1-vel-label");

    let filterGain1 = document.getElementById("filter-1-gain");
    let filterGainOutput1 = document.getElementById("filter-1-gain-label");

    let filterQ1 = document.getElementById("filter-1-q");
    let filterQOutput1 = document.getElementById("filter-1-q-label");

    let filterType2 = document.getElementById("filter-2-type");
    
    let filterFreq2 = document.getElementById("filter-2-freq");
    let filterFreqOutput2 = document.getElementById("filter-2-freq-label");

    let filterVel2 = document.getElementById("filter-2-vel");
    let filterVelOutput2 = document.getElementById("filter-2-vel-label");

    let filterGain2 = document.getElementById("filter-2-gain");
    let filterGainOutput2 = document.getElementById("filter-2-gain-label");

    let filterQ2 = document.getElementById("filter-2-q");
    let filterQOutput2 = document.getElementById("filter-2-q-label");

    let maps = document.getElementsByName("map");

    let sustain = false;

    recordButton.onclick = function() {
        if (!recording) {
            mediaRecorder.start();
            recordButton.innerHTML = "Stop";
            recording = true;
            recordButton.style.backgroundColor = "#CC0000";
        }
        else {
            mediaRecorder.stop();
            recordButton.innerHTML = "Record";
            recording = false;
            recordButton.style.backgroundColor = "#BBBBBB";
        }
    }

    mediaRecorder.ondataavailable = function(evt) {
        // push each chunk (blobs) in an array
        chunks.push(evt.data);
      };
 
      mediaRecorder.onstop = function(evt) {
        // Make blob out of our blobs, and open it.
        var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        chunks = [];
        document.querySelector("audio").src = window.URL.createObjectURL(blob);
      };

    maps.forEach((item, index) => item.onclick = () => {
        midiActiveMap[index] = !midiActiveMap[index];
        maps[index].style.backgroundColor =  midiActiveMap[index] ? "#008CBA" : "#BBBBBB";
    });

    patch.onchange = e => setPatch(patches[e.target.value]);

    function changeElement(element, val, suffix) {
        element.innerHTML = val + suffix;
    }

    function changeTuning(freq) {
        freqOutput.innerHTML = freq + " Hz";
        // change frequency of oscillators already active
        for (let key in activeOscillators) {
            activeOscillators[key].forEach((item, i) => item.frequency.setValueAtTime(midiToFreq(key) * freq / 440 * (i+1), audioCtx.currentTime));
        }
    }

    slider.oninput = e => changeTuning(e.target.value);
    partials.oninput = e => changeElement(partialsOutput, e.target.value, "");

    function setAMFreq(freq) {
        amModulatorOutput.innerHTML = freq + " Hz";
        for (let key in activeOscillators) {
            activeOscillators[key].forEach(item => {
                if (item.amFreq) {
                    item.amFreq.frequency.setValueAtTime(freq, audioCtx.currentTime);
                }
            });
        }
    }

    amModulator.oninput = e => setAMFreq(e.target.value);

    function setAMDepth(depth) {
        amDepthOutput.innerHTML = (depth/1000).toFixed(3);
        for (let key in activeOscillators) {
            activeOscillators[key].forEach(item => {
                if (item.amDepth) {
                    item.amDepth.gain.setValueAtTime(depth/1000, audioCtx.currentTime);
                }
            });
        }
    }

    amDepth.oninput = e => setAMDepth(e.target.value);

    function setFMFreq(freq) {
        fmModulatorOutput.innerHTML = freq + " Hz";
        for (let key in activeOscillators) {
            activeOscillators[key].forEach(item => {
                if (item.fmFreq) {
                    item.fmFreq.frequency.setValueAtTime(freq, audioCtx.currentTime);
                }
            });
        }
    }

    fmModulator.oninput = e => setFMFreq(e.target.value);

    function setFMDepth(depth) {
        fmDepthOutput.innerHTML = depth + " Hz";
        for (let key in activeOscillators) {
            activeOscillators[key].forEach(item => {
                if (item.fmIndex) {
                    item.fmIndex.gain.setValueAtTime(depth, audioCtx.currentTime);
                }
            });
        }
    }

    fmDepth.oninput = e => setFMDepth(e.target.value);

    function setLFO(val) {
        lfoOutput.innerHTML = val + " Hz";
        globalGain.lfo.frequency.setValueAtTime(val, audioCtx.currentTime);
    }

    lfoFreq.oninput = e => setLFO(e.target.value);

    function toggleLFO() {
        if (lfo_select.checked) {
            const lfo = audioCtx.createOscillator();
            globalGain.lfo = lfo;
            globalGain.lfo.frequency.value = lfoFreq.value;
            if (numberOfOscillators) {
                lfoDepth.gain.setTargetAtTime(0.2 / Math.sqrt(numberOfOscillators), audioCtx.currentTime, 0.01);
            }
            globalGain.lfo.connect(lfoDepth).connect(globalGain.gain);
            lfo.start();
        }
        else {
            lfoDepth.gain.setTargetAtTime(0, audioCtx.currentTime, 0.01);
            globalGain.lfo.stop(audioCtx.currentTime + 0.1); // 10 * time constant
        }
    }

    lfo_select.oninput = e => toggleLFO();
    attack.oninput = e => changeElement(attackOutput, e.target.value, " ms");
    decay.oninput = e => changeElement(decayOutput, e.target.value, " ms");
    sustainEnv.oninput = e => changeElement(sustainOutput, (e.target.value/100).toFixed(2), "");
    release.oninput = e => changeElement(releaseOutput, e.target.value, " ms");

    filterType1.onchange = e => biquadFilter1.type = e.target.value;

    function setFilter1(val, element) {
        switch (element) {
            case "frequency":
                filterFreqOutput1.innerHTML = val + " Hz";
                break;
            case "vel":
                filterVelOutput1.innerHTML = val;
                break;
            case "gain":
                filterGainOutput1.innerHTML = val;
                break;
            case "Q":
                filterQOutput1.innerHTML = val;
                break;
            default:
                break;
        }
        if (element != "vel") {
            biquadFilter1[element].value = val;
        }
    }

    filterFreq1.oninput = e => setFilter1(e.target.value, "frequency");
    filterVel1.oninput = e => setFilter1(e.target.value, "vel");
    filterGain1.oninput = e => setFilter1(e.target.value, "gain");
    filterQ1.oninput = e => setFilter1(e.target.value, "Q");

    filterType2.onchange = e => biquadFilter2.type = e.target.value;

    function setFilter2(val, element) {
        switch (element) {
            case "frequency":
                filterFreqOutput2.innerHTML = val + " Hz";
                break;
            case "vel":
                filterVelOutput2.innerHTML = val;
                break;
            case "gain":
                filterGainOutput2.innerHTML = val;
                break;
            case "Q":
                filterQOutput2.innerHTML = val;
                break;
            default:
                break;
        }
        if (val != "vel") {
            biquadFilter2[element].value = val;
        }
    }

    filterFreq2.oninput = e => setFilter2(e.target.value, "frequency");
    filterVel2.oninput = e => setFilter2(e.target.value, "vel");
    filterGain2.oninput = e => setFilter2(e.target.value, "gain");
    filterQ2.oninput = e => setFilter2(e.target.value, "Q");

    const patches = {
        "trumpet": {
            "wave": 1,
            "lfo": false,
            "lfofreq": 5,
            "additive": false,
            "partials": 1,
            "am": false,
            "amfreq": 440,
            "amdepth": 500,
            "fm": false,
            "fmfreq": 400,
            "fmdepth": 10,
            "attack": 10,
            "decay": 10,
            "sustain": 80,
            "release": 10,
            "filtertype1": "lowpass",
            "filterfreq1": 1150,
            "filtervel1": 2,
            "filtergain1": 0,
            "filterq1": 10,
            "filtertype2": "lowpass",
            "filterfreq2": 10000,
            "filtervel2": 0,
            "filtergain2": 0,
            "filterq2": 1,
        },
        "flute": {
            "wave": 1,
            "lfo": false,
            "lfofreq": 5,
            "additive": false,
            "partials": 1,
            "am": false,
            "amfreq": 440,
            "amdepth": 500,
            "fm": false,
            "fmfreq": 400,
            "fmdepth": 10,
            "attack": 15,
            "decay": 0,
            "sustain": 100,
            "release": 50,
            "filtertype1": "lowpass",
            "filterfreq1": 1000,
            "filtervel1": 1,
            "filtergain1": 0,
            "filterq1": 1,
            "filtertype2": "highpass",
            "filterfreq2": 200,
            "filtervel2": 0,
            "filtergain2": 0,
            "filterq2": 1,
        },
        "strings": {
            "wave": 1,
            "lfo": false,
            "lfofreq": 5,
            "additive": false,
            "partials": 1,
            "am": true,
            "amfreq": 6,
            "amdepth": 43,
            "fm": true,
            "fmfreq": 6,
            "fmdepth": 1,
            "attack": 15,
            "decay": 5,
            "sustain": 68,
            "release": 16,
            "filtertype1": "lowpass",
            "filterfreq1": 3300,
            "filtervel1": 1,
            "filtergain1": 0,
            "filterq1": 15,
            "filtertype2": "highpass",
            "filterfreq2": 400,
            "filtervel2": 0,
            "filtergain2": 0,
            "filterq2": 15,
        },
        "clav": {
            "wave": 2,
            "lfo": false,
            "lfofreq": 5,
            "additive": true,
            "partials": 9,
            "am": false,
            "amfreq": 440,
            "amdepth": 500,
            "fm": false,
            "fmfreq": 440,
            "fmdepth": 10,
            "attack": 4,
            "decay": 5,
            "sustain": 35,
            "release": 5,
            "filtertype1": "lowpass",
            "filterfreq1": 10000,
            "filtervel1": 0,
            "filtergain1": 0,
            "filterq1": 1,
            "filtertype2": "lowpass",
            "filterfreq2": 10000,
            "filtervel2": 0,
            "filtergain2": 0,
            "filterq2": 1,
        },
        "organ": {
            "wave": 0,
            "lfo": true,
            "lfofreq": 6,
            "additive": true,
            "partials": 4,
            "am": false,
            "amfreq": 440,
            "amdepth": 500,
            "fm": false,
            "fmfreq": 440,
            "fmdepth": 10,
            "attack": 15,
            "decay": 5,
            "sustain": 60,
            "release": 10,
            "filtertype1": "lowpass",
            "filterfreq1": 10000,
            "filtervel1": 0,
            "filtergain1": 0,
            "filterq1": 1,
            "filtertype2": "lowpass",
            "filterfreq2": 10000,
            "filtervel2": 0,
            "filtergain2": 0,
            "filterq2": 1,
        },
        "piano": {
            "wave": 0,
            "lfo": false,
            "lfofreq": 5,
            "additive": true,
            "partials": 2,
            "am": false,
            "amfreq": 440,
            "amdepth": 500,
            "fm": false,
            "fmfreq": 440,
            "fmdepth": 10,
            "attack": 2,
            "decay": 7000,
            "sustain": 0,
            "release": 10,
            "filtertype1": "lowpass",
            "filterfreq1": 640,
            "filtervel1": 0,
            "filtergain1": 0,
            "filterq1": 1,
            "filtertype2": "lowpass",
            "filterfreq2": 10000,
            "filtervel2": 0,
            "filtergain2": 0,
            "filterq2": 1,
        },
    }

    function setPatch(settings) {
        wavePicker.selectedIndex = settings["wave"];

        lfo_select.checked = settings["lfo"];
        if (globalGain.lfo || lfo_select.checked) {
            toggleLFO();
        }

        lfoOutput.innerHTML = settings["lfofreq"] + " Hz";
        lfoFreq.value = settings["lfofreq"];
        if (globalGain.lfo) {
            globalGain.lfo.frequency.setValueAtTime(settings["lfofreq"], audioCtx.currentTime);
        }

        additive.checked = settings["additive"];
        partialsOutput.innerHTML = settings["partials"];
        partials.value = settings["partials"];

        am.checked = settings["am"];
        setAMFreq(settings["amfreq"]);
        amModulator.value = settings["amfreq"];
        setAMDepth(settings["amdepth"]);
        amDepth.value = settings["amdepth"];

        fm.checked = settings["fm"];
        setFMFreq(settings["fmfreq"]);
        fmModulator.value = settings["fmfreq"];
        setFMDepth(settings["fmdepth"]);
        fmDepth.value = settings["fmdepth"];
        
        attack.value = settings["attack"];
        attackOutput.innerHTML = settings["attack"] + " ms";

        decay.value = settings["decay"];
        decayOutput.innerHTML = settings["decay"] + " ms";

        sustainEnv.value = settings["sustain"];
        sustainOutput.innerHTML = (settings["sustain"]/100).toFixed(2);

        release.value = settings["release"];
        releaseOutput.innerHTML = settings["release"] + " ms";

        filterType1.value = settings["filtertype1"];
        biquadFilter1.type = settings["filtertype1"];
        filterFreq1.value = settings["filterfreq1"];
        setFilter1(settings["filterfreq1"], "frequency");
        filterVel1.value = settings["filtervel1"];
        setFilter1(settings["filtervel1"], "vel");
        filterGain1.value = settings["filtergain1"];
        setFilter1(settings["filtergain1"], "gain");
        filterQ1.value = settings["filterq1"];
        setFilter1(settings["filterq1"], "Q");

        filterType2.value = settings["filtertype2"];
        biquadFilter2.type = settings["filtertype2"];
        filterFreq2.value = settings["filterfreq2"];
        setFilter2(settings["filterfreq2"], "frequency");
        filterVel2.value = settings["filtervel2"];
        setFilter2(settings["filtervel2"], "vel");
        filterGain2.value = settings["filtergain2"];
        setFilter2(settings["filtergain2"], "gain");
        filterQ2.value = settings["filterq2"];
        setFilter2(settings["filterq2"], "Q");
    }

    function removeNote(key) {
        if (activeOscillators[key]) {
            // release
            activeOscillators[key][0].envelope.gain.setValueAtTime(activeOscillators[key][0].envelope.gain.value, audioCtx.currentTime); // create previous event
            activeOscillators[key][0].envelope.gain.linearRampToValueAtTime(0, audioCtx.currentTime + release.value / 1000); // all on same gain node, only need to change first
            activeOscillators[key].forEach(item => {
                item.stop(audioCtx.currentTime + release.value / 1000);
                if (item.fmFreq) {
                    item.fmFreq.stop(audioCtx.currentTime + release.value / 1000);
                }
                if (item.amFreq) {
                    item.amFreq.stop(audioCtx.currentTime + release.value / 1000);
                }
            }); 
            numberOfOscillators -= activeOscillators[key].length;
            // reset gain based on remaining actives (conditional avoids divide by 0)
            if (numberOfOscillators) {
                globalGain.gain.setTargetAtTime(0.6/ Math.sqrt(numberOfOscillators), audioCtx.currentTime, 0.01);
                lfoDepth.gain.setTargetAtTime(0.2/ Math.sqrt(numberOfOscillators), audioCtx.currentTime, 0.01);
            }
            delete activeOscillators[key];
        }
    }
    
    function playNote(key, vel) {
        // const synthModeValue = synthMode.options[synthMode.selectedIndex].value;
        const num_osc = additive.checked ? partials.value : 1;
        const osc = [];
        const amModulatorFreq = audioCtx.createOscillator();
        const fmModulatorFreq = audioCtx.createOscillator();
        const modulatorIndex = audioCtx.createGain();
        // handle Nyquist (we have more than 2 octaves now)
        if (midiToFreq(key) * num_osc > 20000) {
            num_osc = Math.floor(20000 / midiToFreq(key));
        }
        for (let i = 0; i < num_osc; i++) {
            osc.push(audioCtx.createOscillator());
        }
        const envelope = audioCtx.createGain();
        envelope.gain.setValueAtTime(0, audioCtx.currentTime);

        // if velocity effect turned on (nonzero), change cutoff freq
        biquadFilter1.frequency.setValueAtTime(biquadFilter1.frequency.value, audioCtx.currentTime);
        biquadFilter1.frequency.linearRampToValueAtTime(filterFreq1.value * Math.pow(1.5, filterVel1.value * (vel-0.5)), audioCtx.currentTime + 0.01);

        biquadFilter2.frequency.setValueAtTime(biquadFilter2.frequency.value, audioCtx.currentTime);
        biquadFilter2.frequency.linearRampToValueAtTime(filterFreq2.value * Math.pow(1.5, filterVel2.value * (vel-0.5)), audioCtx.currentTime + 0.01);

        // gives slider its functionality, find (i+1)th partial (0 index)
        osc.forEach((_, i) => {
            osc[i].frequency.setValueAtTime(midiToFreq(key) * slider.value / 440 * (i+1), audioCtx.currentTime);
        });
        
        if (am.checked) {
            amModulatorFreq.frequency.value = amModulator.value;
            const modulated = audioCtx.createGain();
            const depth = audioCtx.createGain();
            depth.gain.value = amDepth.value/1000;
            modulated.gain.value = 1.0 - depth.gain.value;
            
            amModulatorFreq.connect(depth).connect(modulated.gain);

            osc.forEach(item => item.connect(modulated));
            osc.forEach(item => item.amFreq = amModulatorFreq);
            osc.forEach(item => item.amDepth = depth);

            modulated.connect(envelope).connect(globalGain);
            amModulatorFreq.start();

        }

        if (fm.checked) {
            fmModulatorFreq.frequency.value = fmModulator.value;
            modulatorIndex.gain.value = fmDepth.value;
            fmModulatorFreq.connect(modulatorIndex);
            osc.forEach(item => modulatorIndex.connect(item.frequency));

            osc.forEach(item => item.fmFreq = fmModulatorFreq);
            osc.forEach(item => item.fmIndex = modulatorIndex);
            
            fmModulatorFreq.start();
        }

        // fill in details from HTML form
        let type = wavePicker.options[wavePicker.selectedIndex].value;
        osc.forEach(item => item.type = type); // choose your favorite waveform

        osc.forEach(item => item.envelope = envelope); // attach envelope to oscilator object so it can be controlled later, all have same envelope
        // attach to global and local gain nodes so both can be changed based on circumstance
        if (!am.checked) {
            osc.forEach(item => item.connect(envelope).connect(globalGain)); 
        }

        osc.forEach(item => item.start());

        numberOfOscillators += Number(num_osc);
        activeOscillators[key] = osc;

        // increase low end to account for human hearing
        let loudness_mult = 1;

        if (midiToFreq(key) > 100) {
            loudness_mult = 0.8;
        }
        else {
            loudness_mult = 0.8 + (100 - midiToFreq(key)) * 0.002;
        }

        // change global gain based on number of oscillators (polyphonic mode), set local gain to 1
        globalGain.gain.setTargetAtTime(0.6/ Math.sqrt(numberOfOscillators), audioCtx.currentTime, 0.01);
        lfoDepth.gain.setTargetAtTime(0.2/ Math.sqrt(numberOfOscillators), audioCtx.currentTime, 0.01);
        envelope.gain.linearRampToValueAtTime(vel * type_mult[type] * loudness_mult, audioCtx.currentTime + attack.value/1000);
        envelope.gain.linearRampToValueAtTime(vel * type_mult[type] * loudness_mult * sustainEnv.value / 100, audioCtx.currentTime + attack.value/1000 + decay.value/1000);
    }
});