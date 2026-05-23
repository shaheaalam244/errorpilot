import * as vscode from 'vscode';
import { DevEnvironment } from '../utils/detector';

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'errorpilot.sidebarView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // Load initial welcome screen
        webviewView.webview.html = this.getHtmlForWelcome();
    }

    /**
     * Shows a beautiful scanning skeleton loading state
     */
    public showLoading(errorText: string, env: DevEnvironment) {
        if (!this._view) {
            // If view is not yet resolved, focus it to trigger resolution
            vscode.commands.executeCommand('errorpilot.sidebarView.focus');
        }
        
        if (this._view) {
            this._view.show?.(true); // Ensure sidebar is visible
            this._view.webview.html = this.getHtmlForLoading(errorText, env);
        }
    }

    /**
     * Renders the analysis diagnostics in the sidebar
     */
    public showAnalysis(errorText: string, rawAnalysis: string, env: DevEnvironment) {
        if (this._view) {
            this._view.webview.html = this.getHtmlForAnalysis(errorText, rawAnalysis, env);
        }
    }

    /**
     * Renders a custom error state inside the sidebar
     */
    public showError(errorText: string, errorMessage: string) {
        if (this._view) {
            this._view.webview.html = this.getHtmlForError(errorText, errorMessage);
        }
    }

    // ==========================================
    // HTML Generation Templates
    // ==========================================

    private getCommonHeadStyles(): string {
        return `
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap');

                :root {
                    --bg-color: #0b0f17;
                    --container-bg: rgba(17, 25, 40, 0.7);
                    --container-border: rgba(255, 255, 255, 0.08);
                    --text-primary: #f3f4f6;
                    --text-secondary: #9ca3af;
                    --accent-violet: #8b5cf6;
                    --accent-violet-glow: rgba(139, 92, 246, 0.25);
                    --accent-cyan: #06b6d4;
                    --accent-emerald: #10b981;
                    --accent-red: #ef4444;
                    --code-bg: #0d1117;
                    --font-outfit: 'Outfit', -apple-system, sans-serif;
                    --font-inter: 'Inter', sans-serif;
                    --font-code: 'Fira Code', monospace;
                }

                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                body {
                    background-color: var(--bg-color);
                    background-image: 
                        radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.12) 0px, transparent 60%),
                        radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.08) 0px, transparent 60%);
                    background-attachment: fixed;
                    color: var(--text-primary);
                    font-family: var(--font-inter);
                    line-height: 1.5;
                    padding: 16px;
                }

                .header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid var(--container-border);
                }

                .header-title-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .logo-icon {
                    width: 30px;
                    height: 30px;
                    background: linear-gradient(135deg, var(--accent-violet), var(--accent-cyan));
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-family: var(--font-outfit);
                    font-weight: 700;
                    font-size: 16px;
                    box-shadow: 0 0 16px var(--accent-violet-glow);
                }

                h1.main-title {
                    font-family: var(--font-outfit);
                    font-size: 18px;
                    font-weight: 700;
                    background: linear-gradient(to right, #ffffff, #c084fc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .badge {
                    background: rgba(139, 92, 246, 0.15);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    color: #c084fc;
                    padding: 2px 8px;
                    border-radius: 9999px;
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    font-family: var(--font-outfit);
                }

                .section-card {
                    background: var(--container-bg);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid var(--container-border);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 16px;
                    box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.25);
                    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
                    transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
                }

                .section-card:hover {
                    border-color: rgba(139, 92, 246, 0.3);
                    box-shadow: 0 8px 30px 0 rgba(139, 92, 246, 0.12);
                    transform: translateY(-1px);
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                }

                .card-header-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 22px;
                    height: 22px;
                    border-radius: 5px;
                    color: white;
                }

                .context-icon { background: rgba(255, 255, 255, 0.08); color: var(--text-secondary); }
                .root-icon { background: rgba(239, 68, 68, 0.15); color: var(--accent-red); }
                .fix-icon { background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); }
                .solution-icon { background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); }
                .welcome-icon { background: rgba(139, 92, 246, 0.15); color: var(--accent-violet); }

                h2 {
                    font-family: var(--font-outfit);
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                p {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                    line-height: 1.6;
                }

                /* Collapsible selected context */
                .collapsible-trigger {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                }

                .collapsible-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.2s ease-out;
                }

                .collapsible-content.open {
                    max-height: 180px;
                    margin-top: 10px;
                    overflow-y: auto;
                }

                .arrow-icon {
                    transition: transform 0.2s ease;
                }

                .arrow-icon.open {
                    transform: rotate(180deg);
                }

                .context-pre {
                    background-color: rgba(0, 0, 0, 0.25);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    padding: 8px;
                    font-family: var(--font-code);
                    font-size: 11px;
                    overflow-x: auto;
                    color: #cbd5e1;
                    white-space: pre-wrap;
                }

                /* Lists */
                ul {
                    list-style: none;
                    margin: 8px 0 12px 8px;
                }

                li {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin-bottom: 6px;
                    position: relative;
                    padding-left: 16px;
                }

                li::before {
                    content: "•";
                    color: var(--accent-violet);
                    font-weight: bold;
                    font-size: 14px;
                    position: absolute;
                    left: 0;
                    top: -1px;
                }

                /* Inline code */
                .inline-code {
                    background: rgba(139, 92, 246, 0.1);
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    color: #c084fc;
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-family: var(--font-code);
                    font-size: 12px;
                }

                /* Code blocks inside markdown */
                .code-block-wrapper {
                    background-color: rgba(0, 0, 0, 0.25);
                    border: 1px solid var(--container-border);
                    border-radius: 8px;
                    overflow: hidden;
                    margin: 12px 0;
                    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
                    border-left: 3px solid var(--accent-cyan);
                }

                .code-block-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.02);
                    padding: 6px 12px;
                    border-bottom: 1px solid var(--container-border);
                }

                .code-block-lang {
                    font-family: var(--font-outfit);
                    font-size: 10px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    letter-spacing: 0.05em;
                }

                .copy-btn {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 4px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-family: var(--font-inter);
                    font-size: 10px;
                    font-weight: 500;
                    padding: 2px 6px;
                    transition: all 0.2s ease;
                }

                .copy-btn:hover {
                    background: rgba(255, 255, 255, 0.04);
                    color: var(--text-primary);
                    border-color: rgba(255, 255, 255, 0.15);
                }

                .copy-btn.copied {
                    background: rgba(16, 185, 129, 0.08);
                    color: var(--accent-emerald);
                    border-color: rgba(16, 185, 129, 0.25);
                }

                pre {
                    padding: 12px;
                    overflow-x: auto;
                    margin: 0;
                    background-color: transparent !important;
                    background: transparent !important;
                }

                pre code {
                    font-family: var(--font-code);
                    font-size: 11px;
                    color: #e2e8f0;
                    display: block;
                    text-align: left;
                    white-space: pre;
                    background-color: transparent !important;
                    background: transparent !important;
                }

                /* Keyframes for smooth animations */
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }

                @keyframes scanGlow {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(200%); }
                }
            </style>
        `;
    }

    private getHeaderHtml(badgeText: string = 'v0.1.0', badgeStyle?: string): string {
        const logoUri = this._view ? this._view.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'assets', 'logo.jpg')).toString() : '';
        const logoElement = logoUri 
            ? `<img src="${logoUri}" alt="ErrorPilot" style="width: 30px; height: 30px; border-radius: 8px; box-shadow: 0 0 16px var(--accent-violet-glow); object-fit: cover;" />`
            : `<div class="logo-icon">E</div>`;
        
        const badgeStyleAttr = badgeStyle ? ` style="${badgeStyle}"` : '';
        return `
            <div class="header">
                <div class="header-title-container">
                    ${logoElement}
                    <h1 class="main-title">ErrorPilot</h1>
                </div>
                <span class="badge"${badgeStyleAttr}>${badgeText}</span>
            </div>
        `;
    }

    private getHtmlForWelcome(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            ${this.getCommonHeadStyles()}
        </head>
        <body>
            ${this.getHeaderHtml('v0.1.0')}

            <div class="section-card">
                <div class="card-header">
                    <div class="card-header-icon welcome-icon">🚀</div>
                    <h2>Welcome to ErrorPilot</h2>
                </div>
                <p>ErrorPilot is your modular, production-ready coding assistant. It automatically detects your programming language and runtime framework to provide contextual analysis.</p>
                <div class="spacer" style="height: 10px;"></div>
                <p><strong>How to use:</strong></p>
                <ul style="margin-top: 5px;">
                    <li>Highlight a bug, error stack, or code snippet in your active editor.</li>
                    <li>Right-click and select <strong>"Analyze with ErrorPilot"</strong>.</li>
                    <li>Or use the Command Palette (<code>Cmd+Shift+P</code>).</li>
                </ul>
            </div>

            <div class="section-card">
                <div class="card-header">
                    <div class="card-header-icon welcome-icon">⚙️</div>
                    <h2>Configure Keys</h2>
                </div>
                <p>If you need to enter or modify your AI API key, open the command palette and run:</p>
                <p style="background: rgba(255,255,255,0.04); padding: 6px; border-radius: 4px; font-family: var(--font-code); font-size: 11px; margin-top: 5px; border: 1px solid var(--container-border);">
                    ErrorPilot: Set AI API Key
                </p>
            </div>
            ${this.getFooterHtml()}
        </body>
        </html>`;
    }

    private getHtmlForLoading(errorText: string, env: DevEnvironment): string {
        const escapedContext = errorText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            ${this.getCommonHeadStyles()}
            <style>
                /* Loading specific animations */
                .skeleton-line {
                    height: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    margin-bottom: 8px;
                    animation: pulse 1.5s infinite ease-in-out;
                }
                .skeleton-line.short { width: 40%; }
                .skeleton-line.medium { width: 75%; }
                .skeleton-line.long { width: 100%; }

                .scanning-box {
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    border-radius: 12px;
                    background: rgba(139, 92, 246, 0.03);
                    padding: 16px;
                    margin-bottom: 16px;
                }

                .scan-line {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(to right, transparent, var(--accent-violet), var(--accent-cyan), transparent);
                    box-shadow: 0 0 8px var(--accent-violet);
                    animation: scanGlow 2.5s infinite linear;
                }
            </style>
        </head>
        <body>
            ${this.getHeaderHtml('Diagnosing', 'background: rgba(6,182,212,0.15); border-color: rgba(6,182,212,0.3); color: #22d3ee;')}

            <!-- Context Info -->
            <div class="section-card" style="border-color: rgba(139,92,246,0.15)">
                <div class="card-header">
                    <div class="card-header-icon context-icon">⚙️</div>
                    <h2>Target Environment</h2>
                </div>
                <p style="font-size: 12px;"><strong>Language:</strong> ${env.language} | <strong>Framework:</strong> ${env.framework}</p>
            </div>

            <!-- Scanner Box -->
            <div class="scanning-box">
                <div class="scan-line"></div>
                <div class="card-header" style="margin-bottom: 12px;">
                    <div class="card-header-icon" style="background: rgba(139,92,246,0.15); color: var(--accent-violet);">⏱️</div>
                    <h2>Scanning Code and Quotas...</h2>
                </div>
                <p style="font-size: 12px; color: var(--text-secondary);">Asking AI to evaluate root causes and fixes...</p>
            </div>

            <!-- Skeleton Panels -->
            <div class="section-card">
                <div class="skeleton-line short" style="background: rgba(239, 68, 68, 0.15);"></div>
                <div class="skeleton-line long"></div>
                <div class="skeleton-line medium"></div>
            </div>

            <div class="section-card">
                <div class="skeleton-line short" style="background: rgba(16, 185, 129, 0.15);"></div>
                <div class="skeleton-line long"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line long"></div>
            </div>
            ${this.getFooterHtml()}
        </body>
        </html>`;
    }

    private getHtmlForAnalysis(errorText: string, rawAnalysis: string, env: DevEnvironment): string {
        const parsedHtml = this.parseMarkdown(rawAnalysis);
        const escapedContext = errorText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            ${this.getCommonHeadStyles()}
        </head>
        <body>
            ${this.getHeaderHtml('Ready', 'background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: var(--accent-emerald);')}

            <!-- Selected Context -->
            <div class="section-card">
                <div class="collapsible-trigger" onclick="toggleContext()">
                    <div class="card-header" style="margin-bottom: 0;">
                        <div class="card-header-icon context-icon">
                            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="12" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <h2>Analyzed Code (${env.language})</h2>
                    </div>
                    <svg id="arrow" class="arrow-icon" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div id="collapsibleContent" class="collapsible-content">
                    <pre class="context-pre"><code>${escapedContext}</code></pre>
                </div>
            </div>

            <!-- Dynamic Markdown Content -->
            <div class="analysis-container">
                ${parsedHtml}
            </div>

            <script>
                function toggleContext() {
                    const content = document.getElementById('collapsibleContent');
                    const arrow = document.getElementById('arrow');
                    content.classList.toggle('open');
                    arrow.classList.toggle('open');
                }

                function copyCode(btn) {
                    const pre = btn.closest('.code-block-wrapper').querySelector('pre');
                    const code = pre.querySelector('code').innerText;
                    
                    navigator.clipboard.writeText(code).then(() => {
                        const span = btn.querySelector('span');
                        const svg = btn.querySelector('svg');
                        const originalText = span.innerText;
                        
                        span.innerText = 'Copied!';
                        btn.classList.add('copied');
                        
                        // Temporary success checkmark icon
                        svg.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
                        
                        setTimeout(() => {
                            span.innerText = originalText;
                            btn.classList.remove('copied');
                            // Restore original copy icon
                            svg.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>';
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy: ', err);
                    });
                }
            </script>
            ${this.getFooterHtml()}
        </body>
        </html>`;
    }

    private getHtmlForError(errorText: string, errorMessage: string): string {
        const escapedContext = errorText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
            
        const escapedError = errorMessage
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            ${this.getCommonHeadStyles()}
            <style>
                .retry-btn {
                    display: inline-block;
                    background: linear-gradient(135deg, var(--accent-violet), var(--accent-cyan));
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-family: var(--font-outfit);
                    font-weight: 600;
                    padding: 8px 16px;
                    cursor: pointer;
                    margin-top: 10px;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .retry-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px var(--accent-violet-glow);
                }
            </style>
        </head>
        <body>
            ${this.getHeaderHtml('Failed', 'background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: var(--accent-red);')}

            <div class="section-card" style="border-color: rgba(239,68,68,0.3);">
                <div class="card-header">
                    <div class="card-header-icon" style="background: rgba(239,68,68,0.15); color: var(--accent-red);">⚠️</div>
                    <h2>Diagnosis Interrupted</h2>
                </div>
                <p>The AI model request failed. This is usually due to network disruptions, invalid API keys, or exceeding AI Free Tier rate limits.</p>
                <div class="spacer" style="height: 10px;"></div>
                <p style="color: #fca5a5; font-family: var(--font-code); font-size: 11px; background: rgba(239,68,68,0.08); padding: 8px; border-radius: 6px; border: 1px solid rgba(239,68,68,0.2);">
                    ${escapedError}
                </p>
                <div class="spacer" style="height: 10px;"></div>
                <p>If you're hitting rate limits, you can switch to another model in settings or set a new API key.</p>
            </div>
            ${this.getFooterHtml()}
        </body>
        </html>`;
    }

    /**
     * Highly optimized line-by-line custom Markdown to styled-HTML parser
     */
    private parseMarkdown(markdown: string): string {
        const lines = markdown.split('\n');
        let html = '';
        let inCodeBlock = false;
        let codeBlockContent = '';
        let codeLanguage = '';
        let inList = false;
        let cardOpened = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Code blocks
            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    inCodeBlock = false;
                    const highlighted = this.highlightCode(codeBlockContent, codeLanguage);
                    
                    html += `<div class="code-block-wrapper">
                        <div class="code-block-header">
                            <span class="code-block-lang">${codeLanguage.toUpperCase() || 'CODE'}</span>
                            <button class="copy-btn" onclick="copyCode(this)">
                                <svg class="copy-icon" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="11" width="11" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                <span>Copy</span>
                            </button>
                        </div>
                        <pre><code>${highlighted.trim()}</code></pre>
                    </div>\n`;
                    codeBlockContent = '';
                    codeLanguage = '';
                } else {
                    inCodeBlock = true;
                    codeLanguage = line.trim().substring(3).trim();
                }
                continue;
            }

            if (inCodeBlock) {
                codeBlockContent += line + '\n';
                continue;
            }

            // Lists
            const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim());
            if (inList && !isListItem && line.trim() !== '') {
                html += '</ul>\n';
                inList = false;
            }

            if (isListItem) {
                if (!inList) {
                    html += '<ul>\n';
                    inList = true;
                }
                const bulletText = line.trim().replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
                const content = this.parseInlineStyles(bulletText);
                html += `<li>${content}</li>\n`;
                continue;
            }

            // Empty lines
            if (line.trim() === '') {
                if (inList) {
                    html += '</ul>\n';
                    inList = false;
                }
                continue;
            }

            // Card structure detection based on headers (## Root Cause, ## Suggested Fix, ## Interactive Code Solution)
            if (line.trim().startsWith('## ') || line.trim().startsWith('### ')) {
                const headerText = line.replace(/^#{2,3}\s+/, '').trim();
                
                // If a card was already open, close it
                if (cardOpened) {
                    html += `</div>\n`;
                    cardOpened = false;
                }

                // Determine card icon and accent color based on title
                let cardClass = 'context-icon';
                let icon = 'ℹ️';
                const lowerHeader = headerText.toLowerCase();
                
                if (lowerHeader.includes('root') || lowerHeader.includes('cause')) {
                    cardClass = 'root-icon';
                    icon = '🔥';
                } else if (lowerHeader.includes('fix') || lowerHeader.includes('suggested')) {
                    cardClass = 'fix-icon';
                    icon = '🛠️';
                } else if (lowerHeader.includes('code') || lowerHeader.includes('solution') || lowerHeader.includes('interactive')) {
                    cardClass = 'solution-icon';
                    icon = '💻';
                }

                html += `<div class="section-card">
                    <div class="card-header">
                        <div class="card-header-icon ${cardClass}">${icon}</div>
                        <h2>${headerText}</h2>
                    </div>\n`;
                
                cardOpened = true;
                continue;
            }

            // Normal paragraphs
            const pContent = this.parseInlineStyles(line);
            html += `<p>${pContent}</p>\n`;
        }

        // Close any trailing open tag
        if (inList) {
            html += '</ul>\n';
        }
        if (cardOpened) {
            html += `</div>\n`;
        }

        return html;
    }

    private parseInlineStyles(text: string): string {
        let escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Bold **text**
        escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Inline code `code`
        escaped = escaped.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        return escaped;
    }

    /**
     * Highly stable and fast regex-based code block syntax highlighter
     */
    private highlightCode(code: string, lang: string): string {
        const escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const lowerLang = lang.toLowerCase();

        if (lowerLang === 'python' || lowerLang === 'py') {
            return escaped
                // Comments: # ... (colored greyish green)
                .replace(/(#[^\n]*)/g, '<span style="color: #6a737d; font-style: italic;">$1</span>')
                // Strings: double and single quotes
                .replace(/(["'])(.*?)\1/g, '<span style="color: #9ecbff;">$1$2$1</span>')
                // Keywords: def, return, import, from, print, class, if, else, elif, for, in, while, try, except, as, with
                .replace(/\b(def|return|import|from|print|class|if|else|elif|for|in|while|try|except|as|with|and|or|not)\b/g, '<span style="color: #ff7b72; font-weight: bold;">$1</span>')
                // Numbers
                .replace(/\b(\d+)\b/g, '<span style="color: #79c0ff;">$1</span>')
                // Functions
                .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/g, '<span style="color: #d2a8ff;">$1</span>');
        }

        if (
            lowerLang === 'typescript' ||
            lowerLang === 'ts' ||
            lowerLang === 'javascript' ||
            lowerLang === 'js' ||
            lowerLang === 'typescriptreact' ||
            lowerLang === 'javascriptreact' ||
            lowerLang === 'tsx' ||
            lowerLang === 'jsx'
        ) {
            return escaped
                // Comments
                .replace(/(\/\/[^\n]*)/g, '<span style="color: #6a737d; font-style: italic;">$1</span>')
                .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a737d; font-style: italic;">$1</span>')
                // Strings
                .replace(/(["'`])(.*?)\1/g, '<span style="color: #9ecbff;">$1$2$1</span>')
                // Keywords
                .replace(/\b(const|let|var|function|async|await|return|class|export|default|import|from|if|else|for|while|try|catch|new|throw|interface|type|public|private|protected|readonly)\b/g, '<span style="color: #ff7b72; font-weight: bold;">$1</span>')
                // Numbers
                .replace(/\b(\d+)\b/g, '<span style="color: #79c0ff;">$1</span>')
                // Functions
                .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/g, '<span style="color: #d2a8ff;">$1</span>');
        }

        return escaped;
    }

    private getFooterHtml(): string {
        return `
            <div class="footer" style="margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--container-border); text-align: center; font-family: var(--font-outfit);">
                <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 2px;">Engineered by <strong style="color: var(--accent-violet); font-weight: 600;">Shahe Aalam Ansari</strong></p>
                <p style="font-size: 9px; color: rgba(239, 68, 68, 0.7); font-style: italic; margin-top: 4px; padding: 0 8px; line-height: 1.4;">⚠️ ErrorPilot can make mistakes. Please verify critical changes manually.</p>
            </div>
        `;
    }
}

// Sidebar provider: Stylesheet and glassmorphism definitions configured

// Laser scanner overlay skeleton loaders registered

// Sidebar collapsible element handlers active

// Markdown parser successfully handles lists and headings

// Syntax highlighter fully calibrated for python and typescript

// Sidebar provider: Stylesheet and glassmorphism definitions configured

// Laser scanner overlay skeleton loaders registered

// Sidebar collapsible element handlers active

// Markdown parser successfully handles lists and headings

// Syntax highlighter fully calibrated for python and typescript

// Sidebar provider: Stylesheet and glassmorphism definitions configured

// Laser scanner overlay skeleton loaders registered

// Sidebar collapsible element handlers active

// Markdown parser successfully handles lists and headings

// Syntax highlighter fully calibrated for python and typescript

// Sidebar provider: Stylesheet and glassmorphism definitions configured

// Laser scanner overlay skeleton loaders registered

// Sidebar collapsible element handlers active

// Markdown parser successfully handles lists and headings
