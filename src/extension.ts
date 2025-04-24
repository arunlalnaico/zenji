import * as vscode from 'vscode';
import * as fs from 'fs';

let zenjiPanel: vscode.WebviewPanel | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
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
        } else {
            openZenjiOnboarding(context);
        }
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('zenjispace.open', () => {
            if (context.globalState.get('onboardingComplete', false)) {
                openZenjiDashboard(context);
            } else {
                openZenjiOnboarding(context);
            }
        }),
        vscode.commands.registerCommand('zenjispace.onboarding', () => openZenjiOnboarding(context)),
        vscode.commands.registerCommand('zenjispace.clearData', async () => {
            const confirm = await vscode.window.showWarningMessage(
                'This will clear all Zenjispace user data. This action cannot be undone.',
                { modal: true },
                'Clear Data', 'Cancel'
            );
            if (confirm === 'Clear Data') {
                await clearAllData(context);
                vscode.window.showInformationMessage('Zenjispace data has been cleared successfully.');
            }
        }),
        vscode.commands.registerCommand('zenjispace.forceCompleteOnboarding', async () => {
            await context.globalState.update('onboardingComplete', true);
            openZenjiDashboard(context);
        })
    );
}

async function clearAllData(context: vscode.ExtensionContext) {
    const keysToRemove = [
        'avatar', 'userName', 'focusStats', 'journalEntries',
        'chatHistory', 'sound', 'activeTab', 'activeJournalTab'
    ];
    for (const key of keysToRemove) {
        await context.globalState.update(key, undefined);
    }
    // Make sure to set onboardingComplete to false explicitly
    await context.globalState.update('onboardingComplete', false);
    
    zenjiPanel?.dispose();
    openZenjiOnboarding(context);
}

function openZenjiOnboarding(context: vscode.ExtensionContext) {
    zenjiPanel?.dispose();
    zenjiPanel = createWebviewPanel(context, 'zenjiOnboarding', 'Welcome to Zenjispace', 'media/webviews/onboarding/onboarding.html');
}

function openZenjiDashboard(context: vscode.ExtensionContext) {
    zenjiPanel?.dispose();
    zenjiPanel = createWebviewPanel(context, 'zenjispace', 'Zenjispace', 'media/webviews/dashboard/dashboard.html');
}

function createWebviewPanel(context: vscode.ExtensionContext, viewType: string, title: string, templatePath: string): vscode.WebviewPanel {
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
    panel.webview.onDidReceiveMessage(
        message => {
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
        },
        undefined,
        context.subscriptions
    );

    panel.onDidDispose(() => zenjiPanel = undefined, null, context.subscriptions);
    return panel;
}

export function deactivate() {
    statusBarItem?.dispose();
}
