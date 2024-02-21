import {
    DebugConfigurationProvider,
    DebugConfiguration,
    WorkspaceFolder,
    ExtensionContext,
} from "vscode";
import {DatabricksEnvFileManager} from "../file-managers/DatabricksEnvFileManager";
import path from "node:path";

export interface DatabricksPythonDebugConfiguration extends DebugConfiguration {
    databricks?: boolean;
    program: string;
    env?: Record<string, any>;
    isInternalDatabricksRun?: boolean;
    console?: "integratedTerminal" | "externalTerminal" | "internalConsole";
}

export class DatabricksDebugConfigurationProvider
    implements DebugConfigurationProvider
{
    constructor(
        private readonly context: ExtensionContext,
        private readonly databricksEnvFile: DatabricksEnvFileManager
    ) {}
    async resolveDebugConfigurationWithSubstitutedVariables?(
        folder: WorkspaceFolder | undefined,
        debugConfiguration: DebugConfiguration
    ) {
        if (debugConfiguration.databricks !== true) {
            return debugConfiguration;
        }

        debugConfiguration.env = {
            ...(await this.databricksEnvFile.getEnv()),
            ...(debugConfiguration.env ?? {}),
        };

        const userProgram = debugConfiguration.program;
        debugConfiguration.program = this.context.asAbsolutePath(
            path.join("resources", "python", "dbconnect-bootstrap.py")
        );

        debugConfiguration.args = [
            userProgram,
            ...(debugConfiguration.args ?? []),
        ];

        return debugConfiguration;
    }
}
