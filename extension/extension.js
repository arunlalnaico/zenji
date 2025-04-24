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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
let zenjiPanel;
function activate(context) {
    console.log('Zenjispace is now active!');
    // Check if this is the first run after installation/update
    const isFirstRun = context.globalState.get('zenjiFirstRun', true);
    const onboardingComplete = context.globalState.get('onboardingComplete', false);
    if (isFirstRun) {
        // Mark that first run has occurred
        context.globalState.update('zenjiFirstRun', false);
        // Open Zenjispace onboarding on first run
        if (!onboardingComplete) {
            openZenjiOnboarding(context);
        }
        else {
            openZenjiDashboard(context);
        }
    }
    // Register the command to open Zenjispace
    let openCommand = vscode.commands.registerCommand('zenjispace.open', () => {
        if (!onboardingComplete) {
            openZenjiOnboarding(context);
        }
        else {
            openZenjiDashboard(context);
        }
    });
    // Register onboarding command
    let onboardingCommand = vscode.commands.registerCommand('zenjispace.onboarding', () => {
        openZenjiOnboarding(context);
    });
    // Register clear data command
    let clearDataCommand = vscode.commands.registerCommand('zenjispace.clearData', () => __awaiter(this, void 0, void 0, function* () {
        const confirm = yield vscode.window.showWarningMessage('This will clear all Zenjispace user data including preferences, journal entries, and usage statistics. This action cannot be undone.', { modal: true }, 'Clear Data', 'Cancel');
        if (confirm === 'Clear Data') {
            // Clear all data from state
            yield clearAllData(context);
            // Show confirmation
            vscode.window.showInformationMessage('Zenjispace data has been cleared successfully.');
            // No need to reset panel here as clearAllData already handles that
        }
    }));
    context.subscriptions.push(openCommand, onboardingCommand, clearDataCommand);
}
exports.activate = activate;
// Clear all user data
function clearAllData(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Reset important state values
        yield context.globalState.update('onboardingComplete', false);
        yield context.globalState.update('zenjiFirstRun', true);
        // List of all state keys to clear
        const keysToRemove = [
            'avatar',
            'userName',
            'focusStats',
            'journalEntries',
            'chatHistory',
            'sound',
            'activeTab',
            'activeJournalTab'
        ];
        // Clear each key
        for (const key of keysToRemove) {
            yield context.globalState.update(key, undefined);
        }
        // If the panel is open, send a message to clear the webview state too
        if (zenjiPanel) {
            zenjiPanel.webview.postMessage({ command: 'clearData' });
            // Dispose the current panel
            zenjiPanel.dispose();
            zenjiPanel = undefined;
            // Open the onboarding panel after a short delay to ensure clean reset
            setTimeout(() => {
                openZenjiOnboarding(context);
            }, 500);
        }
        else {
            // If there's no panel open, directly open the onboarding
            openZenjiOnboarding(context);
        }
    });
}
function openZenjiOnboarding(context) {
    if (zenjiPanel) {
        zenjiPanel.dispose();
    }
    // Create the onboarding panel
    zenjiPanel = vscode.window.createWebviewPanel('zenjiOnboarding', 'Welcome to Zenjispace', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
            vscode.Uri.file(context.extensionPath)
        ]
    });
    // Get paths to the various resource folders
    const mediaPath = vscode.Uri.file(context.asAbsolutePath('media'));
    const stylesPath = vscode.Uri.file(context.asAbsolutePath('media/styles'));
    const scriptsPath = vscode.Uri.file(context.asAbsolutePath('media/scripts'));
    const assetsPath = vscode.Uri.file(context.asAbsolutePath('media/assets'));
    // Convert to webview URIs
    const mediaUri = zenjiPanel.webview.asWebviewUri(mediaPath);
    const stylesUri = zenjiPanel.webview.asWebviewUri(stylesPath);
    const scriptsUri = zenjiPanel.webview.asWebviewUri(scriptsPath);
    const assetsUri = zenjiPanel.webview.asWebviewUri(assetsPath);
    // Load the onboarding HTML template
    const onboardingTemplatePath = context.asAbsolutePath('media/webviews/onboarding/onboarding.html');
    let onboardingHtml = fs.readFileSync(onboardingTemplatePath, 'utf8');
    // Replace template variables
    onboardingHtml = onboardingHtml
        .replace(/\{\{mediaUri\}\}/g, mediaUri.toString())
        .replace(/\{\{stylesUri\}\}/g, stylesUri.toString())
        .replace(/\{\{scriptsUri\}\}/g, scriptsUri.toString())
        .replace(/\{\{assetsUri\}\}/g, assetsUri.toString());
    // Set webview content
    zenjiPanel.webview.html = onboardingHtml;
    // Handle messages from the webview
    zenjiPanel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'alert':
                vscode.window.showInformationMessage(message.text);
                return;
            case 'onboardingComplete':
                // Save that onboarding is complete
                context.globalState.update('onboardingComplete', true);
                // Open the main dashboard
                openZenjiDashboard(context);
                return;
        }
    }, undefined, context.subscriptions);
    // Reset when the panel is closed
    zenjiPanel.onDidDispose(() => {
        zenjiPanel = undefined;
    }, null, context.subscriptions);
}
function openZenjiDashboard(context) {
    // If we already have a panel, show it
    if (zenjiPanel) {
        zenjiPanel.reveal(vscode.ViewColumn.One);
        return;
    }
    // Otherwise, create a new panel
    zenjiPanel = vscode.window.createWebviewPanel('zenjispace', 'Zenjispace', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
            vscode.Uri.file(context.extensionPath)
        ]
    });
    // Get paths to the various resource folders
    const mediaPath = vscode.Uri.file(context.asAbsolutePath('media'));
    const stylesPath = vscode.Uri.file(context.asAbsolutePath('media/styles'));
    const scriptsPath = vscode.Uri.file(context.asAbsolutePath('media/scripts'));
    const assetsPath = vscode.Uri.file(context.asAbsolutePath('media/assets'));
    // Convert to webview URIs
    const mediaUri = zenjiPanel.webview.asWebviewUri(mediaPath);
    const stylesUri = zenjiPanel.webview.asWebviewUri(stylesPath);
    const scriptsUri = zenjiPanel.webview.asWebviewUri(scriptsPath);
    const assetsUri = zenjiPanel.webview.asWebviewUri(assetsPath);
    // Load the dashboard HTML template
    const dashboardTemplatePath = context.asAbsolutePath('media/webviews/dashboard/dashboard.html');
    let dashboardHtml = fs.readFileSync(dashboardTemplatePath, 'utf8');
    // Replace template variables
    dashboardHtml = dashboardHtml
        .replace(/\{\{mediaUri\}\}/g, mediaUri.toString())
        .replace(/\{\{stylesUri\}\}/g, stylesUri.toString())
        .replace(/\{\{scriptsUri\}\}/g, scriptsUri.toString())
        .replace(/\{\{assetsUri\}\}/g, assetsUri.toString());
    // Set webview content
    zenjiPanel.webview.html = dashboardHtml;
    // Handle messages from the webview
    zenjiPanel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'alert':
                vscode.window.showInformationMessage(message.text);
                return;
            case 'executeCommand':
                // Execute a VS Code command
                if (message.commandId) {
                    vscode.commands.executeCommand(message.commandId);
                }
                return;
        }
    }, undefined, context.subscriptions);
    // Reset when the panel is closed
    zenjiPanel.onDidDispose(() => {
        zenjiPanel = undefined;
    }, null, context.subscriptions);
}
function deactivate() { }
exports.deactivate = deactivate;
