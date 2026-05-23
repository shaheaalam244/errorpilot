import * as vscode from 'vscode';
import { SidebarProvider } from './providers/sidebarProvider';
import { AIService } from './services/aiService';
import { detectEnvironment } from './utils/detector';

// =========================================================================
// 🔑 PASTE YOUR AI API KEY HERE IF YOU WANT TO HARDCODE IT DIRECTLY:
const HARDCODED_API_KEY = "PASTE_YOUR_AI_API_KEY_HERE" as string;
// =========================================================================

/**
 * Helper to get AI API key securely.
 * Checks local file config first, then Secrets store, then fallback to env variable, then prompts the user.
 */
async function getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    // 0. Check if user hardcoded the key in this file
    if (HARDCODED_API_KEY && HARDCODED_API_KEY !== "PASTE_YOUR_AI_API_KEY_HERE" && HARDCODED_API_KEY.trim().length > 0) {
        return HARDCODED_API_KEY.trim();
    }

    // 1. Try to read from secret storage (check new key first, then old legacy key)
    let apiKey = await context.secrets.get("errorpilot_api_key");
    if (!apiKey) {
        apiKey = await context.secrets.get("gemini_api_key");
    }
    if (apiKey && apiKey.trim().length > 0) {
        return apiKey.trim();
    }

    // 2. Check process.env
    const envKey = process.env.ERRORPILOT_API_KEY || process.env.GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 0) {
        await context.secrets.store("errorpilot_api_key", envKey.trim());
        return envKey.trim();
    }

    // 3. Prompt user
    const userKey = await vscode.window.showInputBox({
        prompt: "Enter your Google AI API Key. (Get a free key from Google AI Studio: https://aistudio.google.com)",
        placeHolder: "AIzaSy...",
        ignoreFocusOut: true,
        password: true
    });

    if (userKey && userKey.trim().length > 0) {
        await context.secrets.store("errorpilot_api_key", userKey.trim());
        vscode.window.showInformationMessage("ErrorPilot: AI API Key saved securely.");
        return userKey.trim();
    }

    return undefined;
}

export function activate(context: vscode.ExtensionContext) {
    // Initialize Sidebar webview provider
    const sidebarProvider = new SidebarProvider(context.extensionUri);

    // Register sidebar view provider with VS Code
    const viewRegistration = vscode.window.registerWebviewViewProvider(
        SidebarProvider.viewType,
        sidebarProvider
    );

    // Command 1: Analyze error/code snippet
    const analyzeDisposable = vscode.commands.registerCommand('errorpilot.analyze', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('ErrorPilot: Open a file first to analyze code.');
            return;
        }

        // 1. Get selected text or fall back to full document
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        const fullText = editor.document.getText();
        const text = selectedText && selectedText.trim().length > 0 ? selectedText : fullText;

        if (!text || text.trim().length === 0) {
            vscode.window.showErrorMessage('ErrorPilot: Active editor is empty. Nothing to analyze.');
            return;
        }

        // 2. Detect language & framework environment
        const env = detectEnvironment(editor.document);

        // 3. Trigger sidebar focus and loading state
        // This will automatically slide/open the sidebar view
        vscode.commands.executeCommand('workbench.view.extension.errorpilot-sidebar-container');
        sidebarProvider.showLoading(text, env);

        // 4. Retrieve API key
        const apiKey = await getApiKey(context);
        if (!apiKey) {
            sidebarProvider.showError(
                text,
                "API Key is missing. Click the command 'ErrorPilot: Set AI API Key' in the Command Palette to enter your key."
            );
            return;
        }

        // 5. Run analysis with AI Service
        try {
            const config = vscode.workspace.getConfiguration('errorpilot');
            const modelName = config.get<string>('model') || 'gemini-3.5-flash';

            const aiService = new AIService(apiKey);
            const responseText = await aiService.analyze(text, env, modelName);

            // Render results
            sidebarProvider.showAnalysis(text, responseText, env);
        } catch (err: any) {
            console.error(err);
            sidebarProvider.showError(text, err.message || err);
        }
    });

    // Command 2: Reset/Set API Key
    const setKeyDisposable = vscode.commands.registerCommand('errorpilot.setApiKey', async () => {
        const userKey = await vscode.window.showInputBox({
            prompt: "Update AI API Key (Leave blank to delete saved key)",
            placeHolder: "AIzaSy...",
            ignoreFocusOut: true,
            password: true
        });

        if (userKey === undefined) {
            return; // Cancelled
        }

        if (userKey.trim().length === 0) {
            await context.secrets.delete("errorpilot_api_key");
            await context.secrets.delete("gemini_api_key");
            vscode.window.showInformationMessage("ErrorPilot: AI API Key has been removed.");
        } else {
            await context.secrets.store("errorpilot_api_key", userKey.trim());
            // Clear legacy key to avoid sync issues
            await context.secrets.delete("gemini_api_key");
            vscode.window.showInformationMessage("ErrorPilot: AI API Key updated successfully.");
        }
    });

    context.subscriptions.push(viewRegistration, analyzeDisposable, setKeyDisposable);
}

export function deactivate() { }
// Commands: errorpilot.analyze and errorpilot.setApiKey active

// Commands: errorpilot.analyze and errorpilot.setApiKey active

// Commands: errorpilot.analyze and errorpilot.setApiKey active
