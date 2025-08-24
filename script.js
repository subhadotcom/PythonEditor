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
        
        // Add scroll buttons to panels
        this.addScrollButtons();

        resizer.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            this.lastX = e.clientX;
            resizer.classList.add('resizing');

            const isMobile = window.innerWidth <= 768;
            document.body.style.cursor = isMobile ? 'row-resize' : 'col-resize';

            // Prevent text selection during resize
            document.body.style.userSelect = 'none';
            document.body.style.pointerEvents = 'none';

            // Add overlay to prevent iframe interference
            const overlay = document.createElement('div');
            overlay.id = 'resize-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                cursor: ${isMobile ? 'row-resize' : 'col-resize'};
            `;
            document.body.appendChild(overlay);

            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isResizing) return;

            const container = document.querySelector('.main-content');
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                // Handle vertical resizing for mobile
                const containerHeight = container.offsetHeight;
                const deltaY = e.clientY - this.lastX;

                const editorHeight = editorPanel.offsetHeight;
                const outputHeight = outputPanel.offsetHeight;

                const newEditorHeight = editorHeight + deltaY;
                const newOutputHeight = outputHeight - deltaY;

                const minHeight = 200;
                if (newEditorHeight >= minHeight && newOutputHeight >= minHeight) {
                    const editorFlex = (newEditorHeight / containerHeight) * 100;
                    const outputFlex = (newOutputHeight / containerHeight) * 100;

                    editorPanel.style.flex = `0 0 ${editorFlex}%`;
                    outputPanel.style.flex = `0 0 ${outputFlex}%`;

                    this.lastX = e.clientY;
                    this.saveLayout(editorFlex, outputFlex, true);
                }
            } else {
                // Handle horizontal resizing for desktop
                const containerWidth = container.offsetWidth;
                const deltaX = e.clientX - this.lastX;

                const editorWidth = editorPanel.offsetWidth;
                const outputWidth = outputPanel.offsetWidth;

                const newEditorWidth = editorWidth + deltaX;
                const newOutputWidth = outputWidth - deltaX;

                const minWidth = 280;
                if (newEditorWidth >= minWidth && newOutputWidth >= minWidth) {
                    const editorFlex = (newEditorWidth / containerWidth) * 100;
                    const outputFlex = (newOutputWidth / containerWidth) * 100;

                    editorPanel.style.flex = `0 0 ${editorFlex}%`;
                    outputPanel.style.flex = `0 0 ${outputFlex}%`;

                    this.lastX = e.clientX;
                    this.saveLayout(editorFlex, outputFlex, false);
                }
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isResizing) {
                this.isResizing = false;
                document.querySelector('#resizer').classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.body.style.pointerEvents = '';

                // Remove resize overlay
                const overlay = document.getElementById('resize-overlay');
                if (overlay) {
                    document.body.removeChild(overlay);
                }
            }
        });
    }
    
    addScrollButtons() {
        // Add scroll buttons to editor
        const editorContainer = document.querySelector('.editor-container');
        this.addScrollButtonsToContainer(editorContainer, 'editor');

        // Add scroll buttons to output
        const outputContainer = document.querySelector('.output-container');
        this.addScrollButtonsToContainer(outputContainer, 'output');
    }

    addScrollButtonsToContainer(container, type) {
        // Top scroll button
        const topBtn = document.createElement('button');
        topBtn.className = 'scroll-btn scroll-btn-top';
        topBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        topBtn.title = 'Scroll to top';
        topBtn.addEventListener('click', () => {
            if (type === 'editor' && window.pythonEditor) {
                window.pythonEditor.getEditor().scrollTo(0, 0);
            } else if (type === 'output') {
                const outputElement = document.getElementById('output');
                outputElement.scrollTop = 0;
            }
        });

        // Bottom scroll button
        const bottomBtn = document.createElement('button');
        bottomBtn.className = 'scroll-btn scroll-btn-bottom';
        bottomBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        bottomBtn.title = 'Scroll to bottom';
        bottomBtn.addEventListener('click', () => {
            if (type === 'editor' && window.pythonEditor) {
                const editor = window.pythonEditor.getEditor();
                const lastLine = editor.lastLine();
                editor.scrollTo(0, editor.heightAtLine(lastLine, 'local'));
            } else if (type === 'output') {
                const outputElement = document.getElementById('output');
                outputElement.scrollTop = outputElement.scrollHeight;
            }
        });

        container.appendChild(topBtn);
        container.appendChild(bottomBtn);

        // Show/hide buttons based on scroll position
        const scrollableElement = type === 'output' ? 
            document.getElementById('output') : 
            container.querySelector('.CodeMirror-scroll');

        const updateButtonVisibility = () => {
            if (type === 'editor' && window.pythonEditor) {
                const editor = window.pythonEditor.getEditor();
                const scrollInfo = editor.getScrollInfo();
                topBtn.style.opacity = scrollInfo.top > 50 ? '0.8' : '0.3';
                bottomBtn.style.opacity = 
                    scrollInfo.top < (scrollInfo.height - scrollInfo.clientHeight - 50) ? '0.8' : '0.3';
            } else if (type === 'output' && scrollableElement) {
                const isAtTop = scrollableElement.scrollTop <= 50;
                const isAtBottom = scrollableElement.scrollTop >= 
                    (scrollableElement.scrollHeight - scrollableElement.clientHeight - 50);
                topBtn.style.opacity = isAtTop ? '0.3' : '0.8';
                bottomBtn.style.opacity = isAtBottom ? '0.3' : '0.8';
            }
        };

        // Update visibility on scroll
        if (scrollableElement) {
            scrollableElement.addEventListener('scroll', updateButtonVisibility);
        }

        // Initial visibility check
        setTimeout(updateButtonVisibility, 100);
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
    
    saveLayout(editorFlex, outputFlex, isMobile = false) {
        try {
            const layoutKey = isMobile ? 'editor_layout_mobile' : 'editor_layout_desktop';
            localStorage.setItem(layoutKey, JSON.stringify({
                editorFlex,
                outputFlex,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Could not save layout:', e);
        }
    }

    loadLayout() {
        try {
            const isMobile = window.innerWidth <= 768;
            const layoutKey = isMobile ? 'editor_layout_mobile' : 'editor_layout_desktop';
            const savedLayout = localStorage.getItem(layoutKey);

            if (savedLayout) {
                const { editorFlex, outputFlex } = JSON.parse(savedLayout);
                const editorPanel = document.querySelector('.editor-panel');
                const outputPanel = document.querySelector('.output-panel');

                // Apply saved layout with smooth transition
                editorPanel.style.transition = 'flex 0.3s ease';
                outputPanel.style.transition = 'flex 0.3s ease';

                editorPanel.style.flex = `0 0 ${editorFlex}%`;
                outputPanel.style.flex = `0 0 ${outputFlex}%`;

                // Remove transition after animation
                setTimeout(() => {
                    editorPanel.style.transition = '';
                    outputPanel.style.transition = '';
                }, 300);
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
        const editorPanel = document.querySelector('.editor-panel');
        const outputPanel = document.querySelector('.output-panel');

        // Add smooth transition for layout changes
        mainContent.style.transition = 'all 0.3s ease';

        if (isMobile) {
            mainContent.style.flexDirection = 'column';
            // Reset flex for mobile layout
            editorPanel.style.flex = '1';
            outputPanel.style.flex = '0 0 280px';
        } else {
            mainContent.style.flexDirection = 'row';
            // Load appropriate layout
            this.loadLayout();
        }

        // Remove transition after animation
        setTimeout(() => {
            mainContent.style.transition = '';
        }, 300);

        // Refresh editor after layout change
        if (window.pythonEditor && window.pythonEditor.getEditor()) {
            setTimeout(() => {
                window.pythonEditor.getEditor().refresh();
            }, 150);
        }

        // Update scroll button visibility
        setTimeout(() => {
            const scrollButtons = document.querySelectorAll('.scroll-btn');
            scrollButtons.forEach(btn => {
                const event = new Event('scroll');
                const container = btn.closest('.editor-container, .output-container');
                if (container) {
                    const scrollableElement = container.querySelector('.CodeMirror-scroll, #output');
                    if (scrollableElement) {
                        scrollableElement.dispatchEvent(event);
                    }
                }
            });
        }, 200);
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

/* Scroll buttons */
.scroll-btn {
    position: absolute;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 8px;
    cursor: pointer;
    font-size: 14px;
    opacity: 0.3;
    transition: opacity 0.2s ease;
    z-index: 10;
}

.scroll-btn.scroll-btn-top {
    top: 10px;
}

.scroll-btn.scroll-btn-bottom {
    bottom: 10px;
}

.editor-container .scroll-btn,
.output-container .scroll-btn {
    opacity: 0.8; /* Initially visible */
}

.editor-panel:hover .scroll-btn,
.output-panel:hover .scroll-btn {
    opacity: 0.8;
}

.editor-container, .output-container {
    position: relative; /* Needed for absolute positioning of buttons */
}

/* Ensure CodeMirror scrollbars are handled correctly */
.CodeMirror-scroll {
    overflow: auto;
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