import {debug, ProgressLocation, Uri, window} from "vscode";
import {ConnectionManager} from "../configuration/ConnectionManager";
import {promptForAttachingSyncDest} from "./prompts";
import {FileUtils} from "../utils";
import {LocalUri} from "../sync/SyncDestination";

/**
 * Run related commands
 */
export class RunCommands {
    constructor(private connection: ConnectionManager) {}

    /**
     * Run a Python file using the command execution API
     */
    runEditorContentsCommand() {
        return async (resource: Uri) => {
            const targetResource = this.getTargetResource(resource);
            if (targetResource) {
                if (await FileUtils.isNotebook(new LocalUri(targetResource))) {
                    await window.showErrorMessage(
                        'Use "Run File as Workflow on Databricks" for running notebooks'
                    );
                    return;
                }

                if (this.connection.state === "CONNECTING") {
                    await this.connection.waitForConnect();
                }

                if (this.connection.syncDestinationMapper === undefined) {
                    promptForAttachingSyncDest();
                    return;
                }

                await debug.startDebugging(
                    undefined,
                    {
                        type: "databricks",
                        name: "Upload and Run File on Databricks",
                        request: "launch",
                        program: targetResource.fsPath,
                    },
                    {noDebug: true}
                );
            }
        };
    }

    /**
     * Run a Python file or notebook as a workflow on the connected cluster
     */
    runEditorContentsAsWorkflowCommand() {
        return async (resource: Uri) => {
            const targetResource = this.getTargetResource(resource);
            if (targetResource) {
                if (this.connection.state === "CONNECTING") {
                    await this.connection.waitForConnect();
                }

                if (this.connection.syncDestinationMapper === undefined) {
                    promptForAttachingSyncDest();
                    return;
                }

                await debug.startDebugging(
                    undefined,
                    {
                        type: "databricks-workflow",
                        name: "Run File on Databricks as Workflow",
                        request: "launch",
                        program: targetResource.fsPath,
                    },
                    {noDebug: true}
                );
            }
        };
    }

    runConnectWithProgress() {
        return async (resource: Uri) => {
            const targetResource = this.getTargetResource(resource);
            if (targetResource) {                
                // setInterval(() => {
                
                
                window.withProgress(
                    {
                        title: "Nija Test Progress",
                        location: ProgressLocation.Notification,
                    },
                    async (progress, token) => {
                        var intervalId
                        await new Promise((ok, ko) => {
                            var count = 0;
                            intervalId = setInterval(() => {
                                progress.report({ increment: 10})
                                count += 10

                                if (count == 100) { 
                                    ok("done")
                                }
                            }, 500)
                        })
                        clearInterval(intervalId)
                    }
                )
                // await debug.startDebugging(
                //     undefined,
                //     {
                //         type: "databricks-connect-progress",
                //         name: "Run File as Connect with Progress",
                //         request: "launch",
                //         program: targetResource.fsPath,
                //     },
                //     {noDebug: true}
                // );
            }
        };
    }

    private getTargetResource(resource: Uri): Uri | undefined {
        if (!resource && window.activeTextEditor) {
            return window.activeTextEditor.document.uri;
        }
        return resource;
    }
}
