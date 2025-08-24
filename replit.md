# Overview

This is a web-based Python code editor that runs entirely in the browser using Pyodide (Python compiled to WebAssembly). The application provides a full-featured code editing experience with syntax highlighting, autocompletion, and the ability to execute Python code without requiring a backend server. It features a split-pane interface with a CodeMirror-powered editor on one side and an output console on the other, along with file management capabilities and theme switching.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application follows a modular JavaScript class-based architecture with three main components:
- **PythonEditor**: Manages CodeMirror initialization, syntax highlighting, autocompletion, and editor features
- **PythonRunner**: Handles Python code execution using Pyodide WebAssembly integration
- **PythonCodeEditor**: Coordinates UI interactions, layout management, and application-wide functionality

## Editor Implementation
Uses CodeMirror 5.65.16 as the core text editor with:
- Python syntax highlighting and mode
- Custom autocompletion system with Python keywords and built-ins
- Theme switching between light and dark modes
- File operations (new, save, load) with browser localStorage persistence
- Keyboard shortcuts for common operations

## Code Execution Engine
Leverages Pyodide v0.24.1 for client-side Python execution:
- WebAssembly-based Python interpreter running in the browser
- Stdout/stderr capture and redirection to the output panel
- Asynchronous code execution with proper error handling
- No server-side dependencies for Python code execution

## UI/UX Design
Split-pane interface with resizable panels:
- Left panel: CodeMirror editor with file management controls
- Right panel: Output console with execution results
- Responsive design with CSS custom properties for theming
- Font Awesome icons for visual consistency

## Data Persistence
Client-side storage using browser localStorage:
- Automatic saving of code content and editor preferences
- File name and theme preference persistence
- No external database or server storage required

# External Dependencies

## Core Libraries
- **CodeMirror 5.65.16**: Text editor with syntax highlighting and Python mode
- **Pyodide 0.24.1**: WebAssembly-based Python interpreter for browser execution
- **Font Awesome 6.4.0**: Icon library for UI elements

## CDN Resources
All dependencies are loaded from CDNs:
- CodeMirror: cdnjs.cloudflare.com
- Pyodide: cdn.jsdelivr.net
- Font Awesome: cdnjs.cloudflare.com

## Browser APIs
- **localStorage**: For client-side data persistence
- **File API**: For loading Python files from the user's system
- **WebAssembly**: Required for Pyodide Python execution
- **Web Workers** (implicit): Used by Pyodide for Python execution