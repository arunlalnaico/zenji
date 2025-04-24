import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('zenjispace.open', () => {
        const panel = vscode.window.createWebviewPanel(
            'zenjispace',
            'Zenjispace',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(context.extensionPath)]
            }
        );

        panel.webview.html = getWebviewContent(context, panel.webview);
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'zenji.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'zenji.js'));

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Zenjispace</title>
            <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
            <div id="zenji-dashboard">
                <!-- Dashboard Panel Design -->
                <div class="header">
                    <!-- ...existing code from Dashboard Panel Design... -->
                </div>
                <div class="main-tabs">
                    <!-- ...existing code from Main Navigation Tabs... -->
                </div>
                <div class="card">
                    <!-- ...existing code from Focus Tools Card... -->
                </div>
                <div class="card">
                    <!-- ...existing code from Ambient Sounds Card... -->
                </div>
                <div class="card">
                    <!-- ...existing code from Journal Card... -->
                </div>
                <div class="card">
                    <!-- ...existing code from Chat Card... -->
                </div>
            </div>
            <script src="${scriptUri}"></script>
        </body>
        </html>
    `;
}

export function deactivate() {}
