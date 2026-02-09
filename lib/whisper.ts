// // src/lib/whisper.ts
// import { pipeline, Pipeline } from "@xenova/transformers";

// // Use "distil-whisper/distil-medium.en" for speed/accuracy balance
// // or "Xenova/whisper-tiny.en" for maximum speed.
// const P_MODEL = "Xenova/whisper-tiny.en"; 

// class WhisperPipeline {
//   static instance: Promise<Pipeline> | null = null;

//   static async getInstance() {
//     if (this.instance === null) {
//       this.instance = pipeline("automatic-speech-recognition", P_MODEL, {
//           quantized: false, // Use true for smaller memory footprint, false for speed
//       });
//     }
//     return this.instance;
//   }
// }

// export default WhisperPipeline;