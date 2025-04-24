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
let statusBarItem;
function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(zen) Zenji AI";
    statusBarItem.tooltip = "Open Zenjispace - Your mindful AI coding companion";
    statusBarItem.command = 'zenjispace.open';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    const isFirstRun = context.globalState.get('zenjiFirstRun', true);
    const onboardingComplete = context.globalState.get('onboardingComplete', false);
    if (isFirstRun) {
        context.globalState.update('zenjiFirstRun', false);
        if (onboardingComplete) {
            openZenjiDashboard(context);
        }
        else {
            openZenjiOnboarding(context);
        }
    }
    context.subscriptions.push(vscode.commands.registerCommand('zenjispace.open', () => {
        if (context.globalState.get('onboardingComplete', false)) {
            openZenjiDashboard(context);
        }
        else {
            openZenjiOnboarding(context);
        }
    }), vscode.commands.registerCommand('zenjispace.onboarding', () => openZenjiOnboarding(context)), vscode.commands.registerCommand('zenjispace.clearData', () => __awaiter(this, void 0, void 0, function* () {
        const confirm = yield vscode.window.showWarningMessage('This will clear all Zenjispace user data. This action cannot be undone.', { modal: true }, 'Clear Data', 'Cancel');
        if (confirm === 'Clear Data') {
            yield clearAllData(context);
            vscode.window.showInformationMessage('Zenjispace data has been cleared successfully.');
        }
    })), vscode.commands.registerCommand('zenjispace.forceCompleteOnboarding', () => __awaiter(this, void 0, void 0, function* () {
        yield context.globalState.update('onboardingComplete', true);
        openZenjiDashboard(context);
    })));
}
exports.activate = activate;
function clearAllData(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const keysToRemove = [
            'avatar', 'userName', 'focusStats', 'journalEntries',
            'chatHistory', 'sound', 'activeTab', 'activeJournalTab'
        ];
        for (const key of keysToRemove) {
            yield context.globalState.update(key, undefined);
        }
        // Make sure to set onboardingComplete to false explicitly
        yield context.globalState.update('onboardingComplete', false);
        zenjiPanel === null || zenjiPanel === void 0 ? void 0 : zenjiPanel.dispose();
        openZenjiOnboarding(context);
    });
}
function openZenjiOnboarding(context) {
    zenjiPanel === null || zenjiPanel === void 0 ? void 0 : zenjiPanel.dispose();
    zenjiPanel = createWebviewPanel(context, 'zenjiOnboarding', 'Welcome to Zenjispace', 'media/webviews/onboarding/onboarding.html');
}
function openZenjiDashboard(context) {
    zenjiPanel === null || zenjiPanel === void 0 ? void 0 : zenjiPanel.dispose();
    zenjiPanel = createWebviewPanel(context, 'zenjispace', 'Zenjispace', 'media/webviews/dashboard/dashboard.html');
}
function createWebviewPanel(context, viewType, title, templatePath) {
    // Only check if we're trying to open the dashboard
    if (viewType === 'zenjispace') {
        const isOnboardingComplete = context.globalState.get('onboardingComplete', false);
        // If onboarding is not complete, redirect to onboarding page
        if (!isOnboardingComplete) {
            return createWebviewPanel(context, 'zenjiOnboarding', 'Welcome to Zenjispace', 'media/webviews/onboarding/onboarding.html');
        }
    }
    const panel = vscode.window.createWebviewPanel(viewType, title, vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(context.extensionPath)]
    });
    const mediaUri = panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('media')));
    const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('media/styles')));
    const scriptsUri = panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('media/scripts')));
    const assetsUri = panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('media/assets')));
    const template = fs.readFileSync(context.asAbsolutePath(templatePath), 'utf8')
        .replace(/\{\{mediaUri\}\}/g, mediaUri.toString())
        .replace(/\{\{stylesUri\}\}/g, stylesUri.toString())
        .replace(/\{\{scriptsUri\}\}/g, scriptsUri.toString())
        .replace(/\{\{assetsUri\}\}/g, assetsUri.toString());
    panel.webview.html = template;
    // Listen for messages from the webview
    panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'onboardingComplete':
                context.globalState.update('onboardingComplete', true);
                if (message.userData && message.userData.userName) {
                    context.globalState.update('userName', message.userData.userName);
                }
                if (message.userData && message.userData.avatar) {
                    context.globalState.update('avatar', message.userData.avatar);
                }
                openZenjiDashboard(context);
                return;
            case 'updateProfile':
                if (message.avatar) {
                    context.globalState.update('avatar', message.avatar);
                }
                if (message.userName) {
                    context.globalState.update('userName', message.userName);
                }
                return;
            case 'executeCommand':
                if (message.commandId) {
                    vscode.commands.executeCommand(message.commandId);
                }
                return;
            case 'getUserData':
                // Send stored user data to the webview without additional checks
                const userName = context.globalState.get('userName');
                const avatar = context.globalState.get('avatar');
                panel.webview.postMessage({
                    command: 'userData',
                    userName: userName,
                    avatar: avatar
                });
                return;
        }
    }, undefined, context.subscriptions);
    panel.onDidDispose(() => zenjiPanel = undefined, null, context.subscriptions);
    return panel;
}
function deactivate() {
    statusBarItem === null || statusBarItem === void 0 ? void 0 : statusBarItem.dispose();
}
exports.deactivate = deactivate;
