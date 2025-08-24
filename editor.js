/**
 * Python Code Editor - Editor Management
 * Handles CodeMirror initialization, autocompletion, and editor features
 */

class PythonEditor {
    constructor() {
        this.editor = null;
        this.currentTheme = 'monokai';
        this.isLightTheme = false;
        this.fileName = 'untitled.py';
        this.hasUnsavedChanges = false;
        
        // Python keywords and built-ins for autocompletion
        this.pythonKeywords = [
            'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 
            'else', 'except', 'exec', 'finally', 'for', 'from', 'global', 'if', 
            'import', 'in', 'is', 'lambda', 'not', 'or', 'pass', 'print', 'raise', 
            'return', 'try', 'while', 'with', 'yield', 'True', 'False', 'None',
            'async', 'await', 'nonlocal'
        ];
        
        this.pythonBuiltins = [
            'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'breakpoint', 'bytearray', 
            'bytes', 'callable', 'chr', 'classmethod', 'compile', 'complex', 
            'delattr', 'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec', 
            'filter', 'float', 'format', 'frozenset', 'getattr', 'globals', 
            'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance', 
            'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max', 
            'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 
            'print', 'property', 'range', 'repr', 'reversed', 'round', 'set', 
            'setattr', 'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super', 
            'tuple', 'type', 'vars', 'zip', '__import__'
        ];
        
        this.init();
    }
    
    init() {
        this.initializeEditor();
        this.setupAutocompletion();
        this.setupEventListeners();
        this.loadFromStorage();
    }
    
    initializeEditor() {
        const textarea = document.getElementById('codeEditor');
        
        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: 'python',
            theme: this.currentTheme,
            lineNumbers: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            styleActiveLine: true,
            indentUnit: 4,
            indentWithTabs: false,
            lineWrapping: true,
            extraKeys: {
                'Ctrl-Space': 'autocomplete',
                'Tab': (cm) => {
                    if (cm.somethingSelected()) {
                        cm.indentSelection('add');
                    } else {
                        cm.replaceSelection('    ');
                    }
                },
                'Shift-Tab': (cm) => {
                    cm.indentSelection('subtract');
                },
                'Ctrl-/': (cm) => {
                    this.toggleComment();
                },
                'Ctrl-Enter': () => {
                    if (window.pythonRunner) {
                        window.pythonRunner.runCode();
                    }
                },
                'Ctrl-S': (cm) => {
                    this.saveFile();
                    return false;
                },
                'Ctrl-N': (cm) => {
                    this.newFile();
                    return false;
                }
            }
        });
        
        // Update line/column indicator
        this.editor.on('cursorActivity', () => {
            const cursor = this.editor.getCursor();
            document.getElementById('lineCol').textContent = 
                `Line ${cursor.line + 1}, Column ${cursor.ch + 1}`;
        });
        
        // Track changes for unsaved indicator
        this.editor.on('change', () => {
            this.hasUnsavedChanges = true;
            this.updateFileName();
            this.saveToStorage();
        });
        
        // Auto-trigger completion on typing
        this.editor.on('inputRead', (cm, event) => {
            if (event.text[0] && /[a-zA-Z_]/.test(event.text[0])) {
                setTimeout(() => {
                    cm.execCommand('autocomplete');
                }, 100);
            }
        });
    }
    
    setupAutocompletion() {
        CodeMirror.registerHelper('hint', 'python', (editor, options) => {
            const cursor = editor.getCursor();
            const token = editor.getTokenAt(cursor);
            const start = token.start;
            const end = cursor.ch;
            const line = cursor.line;
            
            // Get the current word being typed
            const word = editor.getRange({line, ch: start}, {line, ch: end});
            
            if (!word) return null;
            
            // Filter keywords and built-ins that match the current word
            const suggestions = [
                ...this.pythonKeywords,
                ...this.pythonBuiltins
            ].filter(item => 
                item.toLowerCase().startsWith(word.toLowerCase())
            ).sort();
            
            // Add common Python patterns
            if (word.length >= 2) {
                const patterns = this.getPythonPatterns(word);
                suggestions.unshift(...patterns);
            }
            
            if (suggestions.length === 0) return null;
            
            return {
                list: suggestions,
                from: {line, ch: start},
                to: {line, ch: end}
            };
        });
    }
    
    getPythonPatterns(word) {
        const patterns = [];
        const lowerWord = word.toLowerCase();
        
        // Common Python patterns
        if (lowerWord.startsWith('def') || lowerWord === 'de') {
            patterns.push('def function_name():');
        }
        if (lowerWord.startsWith('cla') || lowerWord === 'cl') {
            patterns.push('class ClassName:');
        }
        if (lowerWord.startsWith('if') || lowerWord === 'i') {
            patterns.push('if condition:');
        }
        if (lowerWord.startsWith('for') || lowerWord === 'fo') {
            patterns.push('for item in iterable:');
        }
        if (lowerWord.startsWith('whi') || lowerWord === 'wh') {
            patterns.push('while condition:');
        }
        if (lowerWord.startsWith('try') || lowerWord === 'tr') {
            patterns.push('try:\n    pass\nexcept Exception as e:\n    pass');
        }
        if (lowerWord.startsWith('imp') || lowerWord === 'im') {
            patterns.push('import module');
            patterns.push('from module import function');
        }
        
        return patterns;
    }
    
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeBtn').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // File operations
        document.getElementById('newBtn').addEventListener('click', () => {
            this.newFile();
        });
        
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveFile();
        });
        
        document.getElementById('loadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.loadFile(e.target.files[0]);
        });
        
        // Prevent default browser shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                    case 'n':
                        e.preventDefault();
                        break;
                }
            }
        });
    }
    
    toggleTheme() {
        this.isLightTheme = !this.isLightTheme;
        document.documentElement.setAttribute('data-theme', this.isLightTheme ? 'light' : 'dark');
        
        // Update CodeMirror theme
        this.currentTheme = this.isLightTheme ? 'default' : 'monokai';
        this.editor.setOption('theme', this.currentTheme);
        
        localStorage.setItem('editor_theme', this.isLightTheme ? 'light' : 'dark');
    }
    
    toggleComment() {
        const cursor = this.editor.getCursor();
        const line = this.editor.getLine(cursor.line);
        
        if (line.trim().startsWith('#')) {
            // Remove comment
            const newLine = line.replace(/^\s*#\s?/, '');
            this.editor.replaceRange(newLine, {line: cursor.line, ch: 0}, {line: cursor.line, ch: line.length});
        } else {
            // Add comment
            const indent = line.match(/^\s*/)[0];
            const newLine = indent + '# ' + line.trim();
            this.editor.replaceRange(newLine, {line: cursor.line, ch: 0}, {line: cursor.line, ch: line.length});
        }
    }
    
    newFile() {
        if (this.hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to create a new file?')) {
                return;
            }
        }
        
        this.editor.setValue('# Welcome to Python Editor\n# Write your Python code here...\n\n');
        this.fileName = 'untitled.py';
        this.hasUnsavedChanges = false;
        this.updateFileName();
        this.updateStatus('New file created');
    }
    
    saveFile() {
        const content = this.editor.getValue();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.hasUnsavedChanges = false;
        this.updateFileName();
        this.updateStatus(`File saved as ${this.fileName}`);
    }
    
    loadFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.editor.setValue(e.target.result);
            this.fileName = file.name;
            this.hasUnsavedChanges = false;
            this.updateFileName();
            this.updateStatus(`File loaded: ${this.fileName}`);
        };
        reader.readAsText(file);
    }
    
    updateFileName() {
        const displayName = this.hasUnsavedChanges ? `${this.fileName} •` : this.fileName;
        document.getElementById('fileName').textContent = displayName;
        document.title = `${displayName} - Python Editor`;
    }
    
    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
        setTimeout(() => {
            document.getElementById('statusText').textContent = 'Ready';
        }, 3000);
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('editor_content', this.editor.getValue());
            localStorage.setItem('editor_filename', this.fileName);
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }
    
    loadFromStorage() {
        try {
            const savedTheme = localStorage.getItem('editor_theme');
            if (savedTheme) {
                this.isLightTheme = savedTheme === 'light';
                document.documentElement.setAttribute('data-theme', this.isLightTheme ? 'light' : 'dark');
                this.currentTheme = this.isLightTheme ? 'default' : 'monokai';
                this.editor.setOption('theme', this.currentTheme);
            }
            
            const savedContent = localStorage.getItem('editor_content');
            if (savedContent) {
                this.editor.setValue(savedContent);
            } else {
                this.editor.setValue('# Welcome to Python Editor\n# Write your Python code here...\n\nprint("Hello, World!")');
            }
            
            const savedFilename = localStorage.getItem('editor_filename');
            if (savedFilename) {
                this.fileName = savedFilename;
                this.updateFileName();
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
            this.editor.setValue('# Welcome to Python Editor\n# Write your Python code here...\n\nprint("Hello, World!")');
        }
    }
    
    getValue() {
        return this.editor.getValue();
    }
    
    setValue(value) {
        this.editor.setValue(value);
    }
    
    focus() {
        this.editor.focus();
    }
    
    getEditor() {
        return this.editor;
    }
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pythonEditor = new PythonEditor();
});
