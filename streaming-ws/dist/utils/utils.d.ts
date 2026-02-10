import { Socket } from "socket.io";
declare const connectedSockets: Map<string, Socket>;
declare const lastStreamingMessage: Map<string, string>;
export { connectedSockets, lastStreamingMessage, };
export type Service = "gmail" | "google-docs" | "sheets" | "calendar" | "drive" | "outlook" | "slack" | "notion" | "google-forms" | "twitter" | "calendly" | "reddit";
export interface Question {
    q: string;
    for: Service[];
}
export declare function streamVoiceMessage(message: string, socketId: string, status: boolean): Promise<void>;
