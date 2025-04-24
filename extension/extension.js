"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
function activate(context) {
    const disposable = vscode.commands.registerCommand('zenjispace.open', () => {
        const panel = vscode.window.createWebviewPanel('zenjispace', 'Zenjispace', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(context.extensionPath)]
        });
        panel.webview.html = getWebviewContent(context, panel.webview);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function getWebviewContent(context, webview) {
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
function deactivate() { }
exports.deactivate = deactivate;
