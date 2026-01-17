declare module 'btch-downloader';
declare module 'yt-dlp-wrap' {
    export default class YTDlpWrap {
        constructor(binaryPath?: string);
        static downloadFromGithub(destPath: string): Promise<void>;
        exec(args: string[]): any;
        execPromise(args: string[]): Promise<any>;
        getVideoInfo(url: string): Promise<any>;
    }
}
declare module 'node-cron';
