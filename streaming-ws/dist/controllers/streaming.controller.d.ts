export declare const pendingAbortRequests: Map<string, {
    resolve: () => void;
    reject: () => void;
    timeout: NodeJS.Timeout;
}>;
export declare const streamVoiceMessageController: (req: any, res: any) => any;
