import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let zenjiPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
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
        } else {
            openZenjiDashboard(context);
        }
    }

    // Register the command to open Zenjispace
    let openCommand = vscode.commands.registerCommand('zenjispace.open', () => {
        if (!onboardingComplete) {
            openZenjiOnboarding(context);
        } else {
            openZenjiDashboard(context);
        }
    });

    // Register onboarding command
    let onboardingCommand = vscode.commands.registerCommand('zenjispace.onboarding', () => {
        openZenjiOnboarding(context);
    });
    
    // Register clear data command
    let clearDataCommand = vscode.commands.registerCommand('zenjispace.clearData', async () => {
        const confirm = await vscode.window.showWarningMessage(
            'This will clear all Zenjispace user data including preferences, journal entries, and usage statistics. This action cannot be undone.',
            { modal: true },
            'Clear Data', 'Cancel'
        );
        
        if (confirm === 'Clear Data') {
            // Clear all data from state
            await clearAllData(context);
            
            // Show confirmation
            vscode.window.showInformationMessage('Zenjispace data has been cleared successfully.');
            
            // No need to reset panel here as clearAllData already handles that
        }
    });

    context.subscriptions.push(openCommand, onboardingCommand, clearDataCommand);
}

// Clear all user data
async function clearAllData(context: vscode.ExtensionContext) {
    // Reset important state values
    await context.globalState.update('onboardingComplete', false);
    await context.globalState.update('zenjiFirstRun', true);
    
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
        await context.globalState.update(key, undefined);
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
    } else {
        // If there's no panel open, directly open the onboarding
        openZenjiOnboarding(context);
    }
}

function openZenjiOnboarding(context: vscode.ExtensionContext) {
    if (zenjiPanel) {
        zenjiPanel.dispose();
    }

    // Create the onboarding panel
    zenjiPanel = vscode.window.createWebviewPanel(
        'zenjiOnboarding',
        'Welcome to Zenjispace',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(context.extensionPath)
            ]
        }
    );

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
    zenjiPanel.webview.onDidReceiveMessage(
        message => {
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
        },
        undefined,
        context.subscriptions
    );

    // Reset when the panel is closed
    zenjiPanel.onDidDispose(
        () => {
            zenjiPanel = undefined;
        },
        null,
        context.subscriptions
    );
}

function openZenjiDashboard(context: vscode.ExtensionContext) {
    // If we already have a panel, show it
    if (zenjiPanel) {
        zenjiPanel.reveal(vscode.ViewColumn.One);
        return;
    }

    // Otherwise, create a new panel
    zenjiPanel = vscode.window.createWebviewPanel(
        'zenjispace',
        'Zenjispace',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(context.extensionPath)
            ]
        }
    );

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
    zenjiPanel.webview.onDidReceiveMessage(
        message => {
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
        },
        undefined,
        context.subscriptions
    );
    
    // Reset when the panel is closed
    zenjiPanel.onDidDispose(
        () => {
            zenjiPanel = undefined;
        },
        null,
        context.subscriptions
    );
}

export function deactivate() {}
