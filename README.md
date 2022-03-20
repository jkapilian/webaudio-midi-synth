# WebAudio MIDI Synth

## Live Demo
Click [here](https://jkapilian.github.io/webaudio-midi-synth/) for a live demo or clone this repo to run it locally.

## MIDI Info
This synth accepts MIDI input and maps notes to their corresponding frequencies using the WebMidi API along with WebAudio. MIDI velocity (how hard a key is pressed) informs the gain of a note being produced, while sustain behavior simulated using the "holdpedal" MIDI message. 

### MIDI Mapping
The `midiMaps` array contains mappings for a Nektar Impact LX88+. Using the Map buttons creates new mappings in browser, while the Download and Import buttons enable saving patches for different MIDI controllers.

## Generating Notes
Each note pressed corresponds to one or more WebAudio oscillators (more if additive synthesis is used), that are all routed into a single global gain node, which is then in turn connected to two biquad filters that can be tuned as desired in the bottom panels, including the option to have MIDI velocity affect the cutoff frequency. This option works by using a positive or negative multiplier which causes the cutoff to increase or decrease, repectively, with an increase in velocity. Additional oscillators are created as needed if AM or FM are selected. A per-note gain node is then enveloped using the ADSR parameters set on the browser page, whose total gain is affected by three multipliers: `vel`, `type_mult`, and `loudness_mult`. `vel` is a normalized value of the MIDI velocity, while `type_mult` takes into account the relative loudness of the four different types of waves, as sawtooth waves have more partials than sine waves, therefore sounding louder. Finally, `loudness_mult` boosts the gain of frequencies below 100Hz in an attempt to account for our ears being less sensitive to lower frequencies. Lastly, the global gain node is cut by the square root of the number of oscillators to ensure that playing polyphonically would not cause clipping while also sounding natural, while and LFO can control the global gain if it is turned on.

## Patches
To demonstrate the functionality of this synth, I implemented a few basic patch sounds with the help of the magazine Sound on Sound:

### Trumpet
As discussed in [these](https://www.soundonsound.com/techniques/synthesizing-brass-instruments) [articles](https://www.soundonsound.com/techniques/synthesizing-wind-instruments) a trumpet sound can be approximated using a sawtooth wave with a short attack passed through a lowpass filter. I also set the velocity to affect the cutoff frequency so louder notes sound brighter.

### Flute
[This](https://www.soundonsound.com/techniques/practical-flute-synthesis) article described how to create a flute sound, using a sawtooth wave with no decay phase and a long release. This sound is then passed through both a lowpass and highpass filter, the former of which is affected by velocity. While the article suggested a lowpass cutoff around 2000 Hz, I found 1000 Hz created a better sound, likely because WebAudio's filters have a set rolloff.

### Strings
I followed [this](https://www.soundonsound.com/techniques/practical-bowed-string-synthesis) article to create a strings patch. This also used a sawtooth wave, this time with a sharp decay and two filters: a resonant lowpass filter at 3.3 kHz that is affected by velocity, and a highpass filter at 400 Hz. Finally, I use AM and FM synthesis as LFOs to create a slight tremelo and vibrato affects.

### Clavinet
I came across this sound while playing around with the settings on this synth. While less sophisticated, adding 9 partials of square waves with a sharp attack and decay creates a convincing clav sound.

### Organ
Similarly simple, this organ sound is 4 partials of sine waves added on top of each other with a 6 Hz LFO controlling the amplitiude.

### E.Piano
Finally, the piano patch roughly followed [this](https://www.soundonsound.com/techniques/synthesizing-pianos) article, where I have two sine partials added together with a short attack and a long (7s) decay. I also used a lowpass filter to decrease the brightness, as an electric piano would usually sound. While none of these patches are perfect, they demonstrate a starting off point of what can be accomplished with this synth.

### Creating New Patches
Similar with the MIDI Mappings, the Add Patch button creates a new patch in browser, while the Download and Import buttons enable saving patches as a file.

## Recording
Using the [MediaStream Recording API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API), I was able to also connect the WebAudio output to a stream that is saved as an audio file. As seen in other projects using this API, the sound files play well in browser but are not handled correctly in most audio players. The recorded audio files do play in [VLC](https://www.videolan.org), so exporting from there allows you to play recordings elsewhere. While not a perfect solution, it works for the time being.