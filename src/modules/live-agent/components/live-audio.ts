/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createBlob, decode, decodeAudioData } from '../utils/audioCodec';
import './visual-3d';

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() status = '';
  @state() error = '';
  @state() showBackground = true;
  @state() showRings = true;
  @state() useDynamicColors = true;
  @state() useSmoothAnimations = true;
  @state() showSettings = false;

  private client: GoogleGenAI;
  private session: Session;
  private inputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({ sampleRate: 16000 });
  private outputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({ sampleRate: 24000 });
  @state() inputNode = this.inputAudioContext.createGain();
  @state() outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream: MediaStream;
  private sourceNode: AudioBufferSourceNode;
  private scriptProcessorNode: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();
  private speechRecognition: any = null;

  static styles = css`
      #status {
        position: absolute;
        bottom: 5vh;
        left: 0;
        right: 0;
        z-index: 10;
        text-align: center;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        pointer-events: none;
      }

      .controls {
        z-index: 100;
        position: absolute;
        bottom: 10vh;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: row;
        gap: 20px;

        button {
          outline: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          width: 56px;
          height: 56px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
      }

      .settings-toggle {
        position: absolute;
        top: 30px;
        right: 30px;
        z-index: 100;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        padding: 10px;
        border-radius: 12px;
        cursor: pointer;
        backdrop-filter: blur(10px);
      }

      .settings-panel {
        position: absolute;
        top: 80px;
        right: 30px;
        z-index: 100;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 20px;
        border-radius: 16px;
        color: white;
        display: flex;
        flex-direction: column;
        gap: 15px;
        min-width: 220px;
      }

      .toggle-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
      }
  `;

  constructor() {
    super();
    this.initClient();
    this.initSpeechRecognition();
  }

  private emitLiveEvent(eventName: string, detail: Record<string, unknown>) {
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: {
          timestamp: Date.now(),
          ...detail,
        },
      }),
    );
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();
    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.outputNode.connect(this.outputAudioContext.destination);
    this.initSession();
  }

  private async initSession() {
    const model = 'gemini-2.5-flash-native-audio-preview-09-2025';

    try {
      this.session = await this.client.live.connect({
        model,
        callbacks: {
          onopen: () => {
            this.updateStatus('Opened');
            this.emitLiveEvent('live-agent:session-status', {
              connected: true,
              message: 'Live session opened',
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts || [];
            const audio = parts.find((part: any) => part.inlineData)?.inlineData;
            const responseText = parts
              .map((part: any) => part.text)
              .filter(Boolean)
              .join(' ')
              .trim();

            if (audio) {
              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime,
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                this.outputAudioContext,
                24000,
                1,
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode);
              source.addEventListener('ended', () => {
                this.sources.delete(source);
              });

              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            if (responseText) {
              this.emitLiveEvent('live-agent:model-response', {
                text: responseText,
              });
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
              this.emitLiveEvent('live-agent:interrupted', {
                reason: 'Server interruption event received',
              });
            }
          },
          onerror: (e: ErrorEvent) => {
            this.updateError(e.message);
            this.emitLiveEvent('live-agent:error', { message: e.message });
          },
          onclose: (e: CloseEvent) => {
            this.updateStatus('Close:' + e.reason);
            this.emitLiveEvent('live-agent:session-status', {
              connected: false,
              message: e.reason || 'Live session closed',
            });
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } },
          },
        },
      });
    } catch (e) {
      console.error(e);
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
    this.emitLiveEvent('live-agent:status', { message: msg });
  }

  private updateError(msg: string) {
    this.error = msg;
    this.emitLiveEvent('live-agent:error', { message: msg });
  }

  private initSpeechRecognition() {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      this.emitLiveEvent('live-agent:status', {
        message: 'Speech recognition unavailable in this browser',
      });
      return;
    }

    this.speechRecognition = new SpeechRecognitionCtor();
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = 'en-US';

    this.speechRecognition.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        this.emitLiveEvent('live-agent:user-transcript', {
          text: finalTranscript.trim(),
          final: true,
        });
      }
    };

    this.speechRecognition.onerror = (event: any) => {
      this.emitLiveEvent('live-agent:error', {
        message: event.error || 'Speech recognition error',
      });
    };
  }

  private startSpeechRecognition() {
    if (!this.speechRecognition) return;
    try {
      this.speechRecognition.start();
    } catch (_e) {
      // Ignore duplicate start errors from browser speech API.
    }
  }

  private stopSpeechRecognition() {
    if (!this.speechRecognition) return;
    try {
      this.speechRecognition.stop();
    } catch (_e) {
      // Ignore stop race conditions.
    }
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    this.inputAudioContext.resume();
    this.updateStatus('Requesting microphone access...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 256;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);
        this.session.sendRealtimeInput({ media: createBlob(pcmData) });
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);
      this.isRecording = true;
      this.updateStatus('Recording...');
      this.emitLiveEvent('live-agent:recording', { recording: true });
      this.startSpeechRecognition();
    } catch (err: any) {
      this.updateStatus(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream && !this.inputAudioContext)
      return;

    this.isRecording = false;
    if (this.scriptProcessorNode && this.sourceNode && this.inputAudioContext) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.stopSpeechRecognition();
    this.emitLiveEvent('live-agent:recording', { recording: false });
    this.updateStatus('Recording stopped.');
  }

  private reset() {
    this.session?.close();
    this.initSession();
    this.updateStatus('Session cleared.');
  }

  render() {
    return html`
      <div>
        <button class="settings-toggle" @click=${() => this.showSettings = !this.showSettings}>
          Settings
        </button>

        ${this.showSettings ? html`
          <div class="settings-panel">
            <label class="toggle-item">
              Starfield
              <input type="checkbox" ?checked=${this.showBackground} @change=${(e: any) => this.showBackground = e.target.checked}>
            </label>
            <label class="toggle-item">
              Aura Rings
              <input type="checkbox" ?checked=${this.showRings} @change=${(e: any) => this.showRings = e.target.checked}>
            </label>
            <label class="toggle-item">
              Dynamic Colors
              <input type="checkbox" ?checked=${this.useDynamicColors} @change=${(e: any) => this.useDynamicColors = e.target.checked}>
            </label>
            <label class="toggle-item">
              Smooth Motion
              <input type="checkbox" ?checked=${this.useSmoothAnimations} @change=${(e: any) => this.useSmoothAnimations = e.target.checked}>
            </label>
          </div>
        ` : ''}

        <div class="controls">
          <button id="resetButton" @click=${this.reset} ?disabled=${this.isRecording}>Reset</button>
          <button id="startButton" @click=${this.startRecording} ?disabled=${this.isRecording}>Start</button>
          <button id="stopButton" @click=${this.stopRecording} ?disabled=${!this.isRecording}>Stop</button>
        </div>

        <div id="status">${this.error || this.status}</div>
        <gdm-live-audio-visuals-3d
          .inputNode=${this.inputNode}
          .outputNode=${this.outputNode}
          .showBackground=${this.showBackground}
          .showRings=${this.showRings}
          .useDynamicColors=${this.useDynamicColors}
          .useSmoothAnimations=${this.useSmoothAnimations}
        ></gdm-live-audio-visuals-3d>
      </div>
    `;
  }
}
