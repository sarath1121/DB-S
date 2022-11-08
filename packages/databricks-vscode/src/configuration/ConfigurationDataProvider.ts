import {NamedLogger} from "@databricks/databricks-sdk/dist/logging";
import {
    Disposable,
    Event,
    EventEmitter,
    ProviderResult,
    ThemeColor,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
} from "vscode";
import {ClusterListDataProvider} from "../cluster/ClusterListDataProvider";
import {CodeSynchronizer} from "../sync/CodeSynchronizer";
import {ConnectionManager} from "./ConnectionManager";

/**
 * Data provider for the cluster tree view
 */
export class ConfigurationDataProvider
    implements TreeDataProvider<TreeItem>, Disposable
{
    private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | void> =
        new EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData: Event<TreeItem | undefined | void> =
        this._onDidChangeTreeData.event;

    private disposables: Array<Disposable> = [];

    constructor(
        private connectionManager: ConnectionManager,
        private sync: CodeSynchronizer
    ) {
        this.disposables.push(
            this.connectionManager.onDidChangeState(() => {
                this._onDidChangeTreeData.fire();
            }),
            this.connectionManager.onDidChangeCluster(() => {
                this._onDidChangeTreeData.fire();
            }),
            this.connectionManager.onDidChangeSyncDestination(() => {
                this._onDidChangeTreeData.fire();
            }),
            this.sync.onDidChangeState(() => {
                this._onDidChangeTreeData.fire();
            })
        );

        this.connectionManager;
    }

    dispose() {
        this.disposables.forEach((d) => d.dispose());
    }

    getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
        return element;
    }

    getChildren(
        element?: TreeItem | undefined
    ): ProviderResult<Array<TreeItem>> {
        if (this.connectionManager.state !== "CONNECTED") {
            return [];
        }
        return (async () => {
            let cluster = this.connectionManager.cluster;
            let syncDestination = this.connectionManager.syncDestination;

            if (!element) {
                let children: Array<TreeItem> = [];
                children.push({
                    label: `Workspace`,
                    iconPath: new ThemeIcon("account"),
                    id: "WORKSPACE",
                    collapsibleState: TreeItemCollapsibleState.Expanded,
                    contextValue: "workspace",
                });

                if (cluster) {
                    children.push({
                        label: "Cluster",
                        iconPath: new ThemeIcon("server"),
                        id: "CLUSTER",
                        collapsibleState: TreeItemCollapsibleState.Expanded,
                        contextValue:
                            cluster.state === "RUNNING"
                                ? "clusterRunning"
                                : cluster.state === "PENDING"
                                ? "clusterPending"
                                : "clusterStopped",
                    });
                } else {
                    children.push({
                        label: `Cluster - "None attached"`,
                        iconPath: new ThemeIcon("server"),
                        id: "CLUSTER",
                        collapsibleState: TreeItemCollapsibleState.Expanded,
                        contextValue: "clusterDetached",
                    });
                }

                if (syncDestination) {
                    // TODO: Add another icon over here for in_progress state
                    // DECO-220
                    children.push({
                        label: `Repo`,
                        iconPath: new ThemeIcon("repo"),
                        id: "REPO",
                        collapsibleState: TreeItemCollapsibleState.Expanded,
                        contextValue:
                            this.sync.state === "WATCHING_FOR_CHANGES" ||
                            this.sync.state === "IN_PROGRESS"
                                ? "syncRunning"
                                : "syncStopped",
                    });
                } else {
                    children.push({
                        label: `Repo - "None attached"`,
                        iconPath: new ThemeIcon("repo"),
                        id: "REPO",
                        collapsibleState: TreeItemCollapsibleState.Expanded,
                        contextValue: "syncDetached",
                    });
                }

                return children;
            }

            const dbWorkspace = this.connectionManager.databricksWorkspace;
            if (element.id === "WORKSPACE" && dbWorkspace) {
                return [
                    {
                        label: "Profile",
                        description: dbWorkspace.profile,
                        collapsibleState: TreeItemCollapsibleState.None,
                    },
                    {
                        label: "User",
                        description: dbWorkspace.userName,
                        collapsibleState: TreeItemCollapsibleState.None,
                    },
                    {
                        label: "Host",
                        description: dbWorkspace.host.toString(),
                        collapsibleState: TreeItemCollapsibleState.None,
                        contextValue: "databricks-link",
                    },
                ];
            }

            if (element.id?.startsWith("CLUSTER") && cluster) {
                const clusterItem =
                    ClusterListDataProvider.clusterNodeToTreeItem(cluster);

                const children = [];

                try {
                    if (
                        !(await cluster.hasExecutePerms(
                            this.connectionManager.databricksWorkspace?.user
                        ))
                    ) {
                        children.push({
                            description:
                                "You might not have permission to run code on this cluster",
                            iconPath: new ThemeIcon(
                                "warning",
                                new ThemeColor("problemsWarningIcon.foreground")
                            ),
                        });
                    }
                } catch (e) {
                    NamedLogger.getOrCreate("Extension").error(
                        `Error in fetching permissions for ${cluster.name}`,
                        e
                    );
                }

                return [
                    {
                        label: "Name:",
                        description: cluster.name,
                        iconPath: clusterItem.iconPath,
                        collapsibleState: TreeItemCollapsibleState.None,
                    },
                    ...children,
                    ...(await ClusterListDataProvider.clusterNodeToTreeItems(
                        cluster
                    )),
                ];
            }

            if (element.id === "REPO" && syncDestination) {
                return [
                    {
                        label: `Name:`,
                        description: syncDestination.name,
                        iconPath:
                            this.sync.state === "WATCHING_FOR_CHANGES" ||
                            this.sync.state === "IN_PROGRESS"
                                ? new ThemeIcon("debug-start")
                                : new ThemeIcon("debug-stop"),
                        collapsibleState: TreeItemCollapsibleState.None,
                    },
                    {
                        label: `URL:`,
                        description: await this.connectionManager
                            .syncDestination?.repo.url,
                        contextValue: "databricks-link",
                    },
                    {
                        label: `State:`,
                        description: this.sync.state,
                        collapsibleState: TreeItemCollapsibleState.None,
                    },
                    {
                        label: `Path:`,
                        description: syncDestination.path.path,
                        collapsibleState: TreeItemCollapsibleState.None,
                    },
                ];
            }
        })();
    }
}
