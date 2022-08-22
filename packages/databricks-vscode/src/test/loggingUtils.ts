import {mkdirSync} from "fs";
import {mkdir, writeFile} from "fs/promises";
import path from "path";
import winston, {format, transports} from "winston";
import {findGitRoot} from "./utils";

export const defaultLogsPath = path.join(
    findGitRoot()!,
    "packages/databricks-vscode/src/test/logs"
);

export class Logger {
    private static _rootLogger: winston.Logger;

    private constructor() {}

    static async getLogger(suite: string, test: string) {
        if (!this._rootLogger) {
            await mkdir(defaultLogsPath, {
                recursive: true,
            });

            this._rootLogger = winston.createLogger({
                levels: {
                    severe: 1000,
                    warning: 900,
                    info: 800,
                    devug: 700,
                    fine: 500,
                    finer: 400,
                    finest: 300,
                },
                format: format.combine(format.timestamp(), format.json()),
                transports: [
                    new transports.File({
                        dirname: defaultLogsPath,
                        filename: "test.log",
                    }),
                    new transports.Console(),
                ],
            });
        }

        return this._rootLogger.child({
            suite: suite,
            test: test,
        });
    }
}

export class ImageLogger {
    private count = 0;
    private images: string[] = [];
    private constructor(readonly dirname: string) {
        mkdirSync(dirname, {recursive: true});
    }

    static getLogger(suite: string, test: string) {
        return new ImageLogger(
            path.join(
                defaultLogsPath,
                suite.replaceAll(" ", "_"),
                test.replaceAll(" ", "_")
            )
        );
    }

    async dump() {
        for (let image of this.images) {
            await writeFile(
                path.join(this.dirname, `image-${this.count}.png`),
                image,
                "base64"
            );
            this.count += 1;
        }

        this.images = [];
    }

    async log(image: string) {
        this.images.push(image);

        if (this.images.length < 10) {
            return;
        }

        await this.dump();
    }
}
