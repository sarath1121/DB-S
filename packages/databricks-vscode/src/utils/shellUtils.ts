import {env} from "vscode";

export function isPowershell() {
    return env.shell.toLowerCase().includes("powershell");
}

export function readCmd() {
    if (isPowershell()) {
        return "Read-Host";
    }
    return "read";
}

export function escapePathArgument(arg: string): string {
    return `"${arg.replaceAll('"', '\\"')}"`;
}
