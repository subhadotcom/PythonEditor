/**
 * Python Code Editor - Main Application
 * Handles UI interactions, layout management, and application coordination
 */

class PythonCodeEditor {
    constructor() {
        this.isResizing = false;
        this.lastX = 0;
        
        this.init();
    }
    
    init() {
        this.setupResizer();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.loadLayout();
        
        // Show welcome message
        this.showWelcomeMessage();
    }
    
    setupResizer() {
        const resizer = document.getElementById('resizer');
        const editorPanel = document.querySelector('.editor-panel');
        const outputPanel = document.querySelector('.output-panel');
        
        resizer.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            this.lastX = e.clientX;
            resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            
            // Prevent text selection during resize
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isResizing) return;
            
            const container = document.querySelector('.main-content');
            const containerWidth = container.offsetWidth;
            const deltaX = e.clientX - this.lastX;
            
            // Get current widths
            const editorWidth = editorPanel.offsetWidth;
            const outputWidth = outputPanel.offsetWidth;
            
            // Calculate new widths
            const newEditorWidth = editorWidth + deltaX;
            const newOutputWidth = outputWidth - deltaX;
            
            // Set minimum widths
            const minWidth = 250;
            if (newEditorWidth >= minWidth && newOutputWidth >= minWidth) {
                const editorFlex = (newEditorWidth / containerWidth) * 100;
                const outputFlex = (newOutputWidth / containerWidth) * 100;
                
                editorPanel.style.flex = `0 0 ${editorFlex}%`;
                outputPanel.style.flex = `0 0 ${outputFlex}%`;
                
                this.lastX = e.clientX;
                
                // Save layout
                this.saveLayout(editorFlex, outputFlex);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isResizing) {
                this.isResizing = false;
                document.querySelector('#resizer').classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }
    
    setupEventListeners() {
        // Run button
        document.getElementById('runBtn').addEventListener('click', () => {
            if (window.pythonRunner) {
                window.pythonRunner.runCode();
            }
        });
        
        // Clear output button
        document.getElementById('clearOutputBtn').addEventListener('click', () => {
            if (window.pythonRunner) {
                window.pythonRunner.clearOutput();
            }
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            if (window.pythonEditor && window.pythonEditor.getEditor()) {
                // Refresh CodeMirror on window resize
                setTimeout(() => {
                    window.pythonEditor.getEditor().refresh();
                }, 100);
            }
        });
        
        // Handle window close with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (window.pythonEditor && window.pythonEditor.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
        
        // Handle drag and drop for files
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        const container = document.querySelector('.container');
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            container.classList.add('drag-over');
        });
        
        container.addEventListener('dragleave', (e) => {
            if (e.relatedTarget === null || !container.contains(e.relatedTarget)) {
                container.classList.remove('drag-over');
            }
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type === 'text/plain' || file.name.endsWith('.py')) {
                    if (window.pythonEditor) {
                        window.pythonEditor.loadFile(file);
                    }
                } else {
                    this.showNotification('Only Python files (.py) and text files are supported.', 'error');
                }
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        if (window.pythonRunner) {
                            window.pythonRunner.runCode();
                        }
                        break;
                        
                    case '`':
                        e.preventDefault();
                        this.focusOutput();
                        break;
                        
                    case '1':
                        e.preventDefault();
                        if (window.pythonEditor) {
                            window.pythonEditor.focus();
                        }
                        break;
                }
            }
            
            // Function keys
            switch (e.key) {
                case 'F5':
                    e.preventDefault();
                    if (window.pythonRunner) {
                        window.pythonRunner.runCode();
                    }
                    break;
                    
                case 'F9':
                    e.preventDefault();
                    if (window.pythonEditor) {
                        window.pythonEditor.toggleTheme();
                    }
                    break;
                    
                case 'Escape':
                    // Clear focus from all elements
                    document.activeElement.blur();
                    break;
            }
        });
    }
    
    focusOutput() {
        const outputElement = document.getElementById('output');
        outputElement.focus();
        outputElement.scrollTop = outputElement.scrollHeight;
    }
    
    saveLayout(editorFlex, outputFlex) {
        try {
            localStorage.setItem('editor_layout', JSON.stringify({
                editorFlex,
                outputFlex
            }));
        } catch (e) {
            console.warn('Could not save layout:', e);
        }
    }
    
    loadLayout() {
        try {
            const savedLayout = localStorage.getItem('editor_layout');
            if (savedLayout) {
                const { editorFlex, outputFlex } = JSON.parse(savedLayout);
                const editorPanel = document.querySelector('.editor-panel');
                const outputPanel = document.querySelector('.output-panel');
                
                editorPanel.style.flex = `0 0 ${editorFlex}%`;
                outputPanel.style.flex = `0 0 ${outputFlex}%`;
            }
        } catch (e) {
            console.warn('Could not load layout:', e);
        }
    }
    
    showWelcomeMessage() {
        setTimeout(() => {
            if (window.pythonRunner && window.pythonRunner.isReady()) {
                const welcomeMessage = `
Welcome to Python Code Editor!

Keyboard Shortcuts:
• Ctrl+Enter or F5: Run code
• Ctrl+S: Save file
• Ctrl+N: New file
• Ctrl+Space: Show autocomplete
• Ctrl+/: Toggle comment
• F9: Toggle theme

Features:
• Python syntax highlighting
• Code autocompletion
• Real-time execution with Pyodide
• File operations (save/load)
• Responsive layout

Start coding in the editor panel!
                `.trim();
                
                const outputElement = document.getElementById('output');
                const welcomeDiv = document.createElement('div');
                welcomeDiv.className = 'output-line system';
                welcomeDiv.style.whiteSpace = 'pre-line';
                welcomeDiv.textContent = welcomeMessage;
                
                outputElement.appendChild(welcomeDiv);
            }
        }, 2000);
    }
    
    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : '#4CAF50'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1001;
            font-family: var(--font-family);
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Handle responsive layout changes
    handleResponsiveLayout() {
        const isMobile = window.innerWidth <= 768;
        const mainContent = document.querySelector('.main-content');
        const resizer = document.getElementById('resizer');
        
        if (isMobile) {
            mainContent.style.flexDirection = 'column';
            resizer.style.width = '100%';
            resizer.style.height = '4px';
        } else {
            mainContent.style.flexDirection = 'row';
            resizer.style.width = '4px';
            resizer.style.height = '100%';
        }
        
        // Refresh editor after layout change
        if (window.pythonEditor && window.pythonEditor.getEditor()) {
            setTimeout(() => {
                window.pythonEditor.getEditor().refresh();
            }, 100);
        }
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.container.drag-over {
    background: rgba(0, 122, 204, 0.1);
}

.container.drag-over::after {
    content: 'Drop Python file here to load';
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 122, 204, 0.9);
    color: white;
    padding: 20px 40px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 500;
    z-index: 1000;
    pointer-events: none;
}
`;
document.head.appendChild(style);

// Initialize main application
document.addEventListener('DOMContentLoaded', () => {
    window.pythonCodeEditor = new PythonCodeEditor();
    
    // Handle responsive layout changes
    window.addEventListener('resize', () => {
        window.pythonCodeEditor.handleResponsiveLayout();
    });
    
    // Initial responsive check
    window.pythonCodeEditor.handleResponsiveLayout();
});
