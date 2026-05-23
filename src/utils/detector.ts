import * as vscode from 'vscode';

export interface DevEnvironment {
    language: string;
    framework: string;
}

/**
 * Automatically detects the programming language and infers the framework
 * from the active VS Code text document.
 */
export function detectEnvironment(document: vscode.TextDocument): DevEnvironment {
    const languageId = document.languageId.toLowerCase();
    const content = document.getText();
    
    let language = 'Unknown';
    let framework = 'None';

    // 1. Language Detection & Normalization
    if (languageId === 'typescriptreact' || languageId === 'typescript') {
        language = 'TypeScript';
    } else if (languageId === 'javascriptreact' || languageId === 'javascript') {
        language = 'JavaScript';
    } else if (languageId === 'python') {
        language = 'Python';
    } else if (languageId === 'html') {
        language = 'HTML';
    } else if (languageId === 'css') {
        language = 'CSS';
    } else {
        // Fallback capitalize languageId
        language = languageId.charAt(0).toUpperCase() + languageId.slice(1);
    }

    // 2. Heuristic Framework/Runtime Detection
    if (language === 'TypeScript' || language === 'JavaScript') {
        if (content.includes('import React') || content.includes('from "react"') || content.includes("from 'react'") || languageId.endsWith('react')) {
            if (content.includes('next/router') || content.includes('next/navigation') || content.includes('next/link')) {
                framework = 'Next.js (React)';
            } else {
                framework = 'React';
            }
        } else if (content.includes("require('express')") || content.includes('import express') || content.includes("require('fs')") || content.includes("import fs from")) {
            framework = 'Node.js (Express)';
        } else if (content.includes('import { Component }') || content.includes('@Angular')) {
            framework = 'Angular';
        } else if (content.includes("from 'vue'") || content.includes('defineComponent')) {
            framework = 'Vue.js';
        } else {
            // General Node.js if package.json exists in workspace
            framework = 'Node.js / Vanilla JavaScript';
        }
    } else if (language === 'Python') {
        if (content.includes('django') || content.includes('DJANGO_SETTINGS_MODULE')) {
            framework = 'Django';
        } else if (content.includes('Flask') || content.includes('import flask')) {
            framework = 'Flask';
        } else if (content.includes('FastAPI') || content.includes('import fastapi')) {
            framework = 'FastAPI';
        } else if (content.includes('pandas') || content.includes('numpy') || content.includes('torch') || content.includes('tensorflow')) {
            framework = 'Data Science / AI (Python)';
        } else {
            framework = 'Vanilla Python';
        }
    }

    return {
        language,
        framework
    };
}

// End of Environment Detector Utility

// End of Environment Detector Utility

// End of Environment Detector Utility
