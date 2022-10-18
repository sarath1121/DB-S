import {
    commands,
    Disposable,
    Event,
    EventEmitter,
    ProviderResult,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri,
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
                    label: `Profile`,
                    iconPath: new ThemeIcon("tools"),
                    id: "PROFILE",
                    collapsibleState: TreeItemCollapsibleState.Expanded,
                    contextValue: "profile",
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
                    children.push({
                        label: `Repo`,
                        iconPath: new ThemeIcon("repo"),
                        id: "REPO",
                        collapsibleState: TreeItemCollapsibleState.Expanded,
                        contextValue:
                            this.sync.state === "RUNNING"
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

            if (element.id === "PROFILE" && this.connectionManager.profile) {
                return [
                    {
                        label: "Name",
                        description: this.connectionManager.profile,
                        collapsibleState: TreeItemCollapsibleState.None,
                    },
                ];
            }

            if (element.id?.startsWith("CLUSTER") && cluster) {
                let clusterItem =
                    ClusterListDataProvider.clusterNodeToTreeItem(cluster);

                return [
                    {
                        label: "Name:",
                        description: cluster.name,
                        iconPath: clusterItem.iconPath,
                        collapsibleState: TreeItemCollapsibleState.None,
                    },
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
                            this.sync.state === "RUNNING"
                                ? new ThemeIcon("debug-start")
                                : new ThemeIcon("debug-stop"),
                        collapsibleState: TreeItemCollapsibleState.None,
                    },
                    {
                        label: `URL:`,
                        description: await this.connectionManager
                            .syncDestination?.repo.url,
                        contextValue: "copyable",
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
