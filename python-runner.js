/**
 * Python Code Runner - Pyodide Integration
 * Handles Python code execution using Pyodide WebAssembly
 */

class PythonRunner {
    constructor() {
        this.pyodide = null;
        this.isLoading = true;
        this.isRunning = false;
        this.outputElement = document.getElementById('output');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.statusElement = document.getElementById('pyodideStatus');
        
        this.init();
    }
    
    async init() {
        try {
            this.updateStatus('Loading Python environment...');
            this.showLoading(true);
            
            // Load Pyodide
            this.pyodide = await loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
            });
            
            // Setup Python environment
            await this.setupPythonEnvironment();
            
            this.isLoading = false;
            this.updateStatus('Python ready');
            this.showLoading(false);
            this.hideLoadingOverlay();
            
            this.appendOutput('Python environment initialized successfully!', 'system');
            this.appendOutput('You can now run Python code.', 'system');
            
        } catch (error) {
            this.isLoading = false;
            this.updateStatus('Python failed to load');
            this.showLoading(false);
            this.hideLoadingOverlay();
            this.appendOutput(`Error initializing Python: ${error.message}`, 'stderr');
            console.error('Pyodide initialization error:', error);
        }
    }
    
    async setupPythonEnvironment() {
        // Setup stdout/stderr capture
        this.pyodide.runPython(`
import sys
from io import StringIO
import traceback

class OutputCapture:
    def __init__(self):
        self.reset()
    
    def reset(self):
        self.stdout = StringIO()
        self.stderr = StringIO()
        self.original_stdout = sys.stdout
        self.original_stderr = sys.stderr
    
    def start_capture(self):
        sys.stdout = self.stdout
        sys.stderr = self.stderr
    
    def stop_capture(self):
        sys.stdout = self.original_stdout
        sys.stderr = self.original_stderr
        
        stdout_value = self.stdout.getvalue()
        stderr_value = self.stderr.getvalue()
        
        return stdout_value, stderr_value

# Global output capture instance
_output_capture = OutputCapture()
        `);
    }
    
    async runCode() {
        if (this.isLoading) {
            this.appendOutput('Python environment is still loading. Please wait...', 'system');
            return;
        }
        
        if (this.isRunning) {
            this.appendOutput('Code is already running. Please wait...', 'system');
            return;
        }
        
        const code = window.pythonEditor.getValue().trim();
        if (!code) {
            this.appendOutput('No code to execute.', 'system');
            return;
        }
        
        this.isRunning = true;
        this.showLoading(true);
        this.updateRunButton(true);
        
        try {
            this.appendOutput(`>>> Running Python code...`, 'system');
            
            // Reset and start output capture
            this.pyodide.runPython('_output_capture.reset()');
            this.pyodide.runPython('_output_capture.start_capture()');
            
            let stdout = '';
            let stderr = '';
            
            try {
                // Execute the user code
                const result = this.pyodide.runPython(code);
                
                // Stop capture and get output
                const [capturedStdout, capturedStderr] = this.pyodide.runPython(`
_output_capture.stop_capture()
stdout_val, stderr_val = _output_capture.stop_capture()
[stdout_val, stderr_val]
                `).toJs();
                
                stdout = capturedStdout || '';
                stderr = capturedStderr || '';
                
                // Display output
                if (stdout) {
                    this.appendOutput(stdout.trim(), 'stdout');
                }
                
                if (stderr) {
                    this.appendOutput(stderr.trim(), 'stderr');
                }
                
                // If there's a result and no stdout, show the result
                if (result !== undefined && result !== null && !stdout) {
                    this.appendOutput(String(result), 'stdout');
                }
                
                if (!stdout && !stderr) {
                    this.appendOutput('Code executed successfully (no output)', 'system');
                }
                
            } catch (pythonError) {
                // Stop capture in case of error
                try {
                    this.pyodide.runPython('_output_capture.stop_capture()');
                } catch (e) {
                    // Ignore capture stop errors
                }
                
                // Format Python error
                const errorMessage = this.formatPythonError(pythonError);
                this.appendOutput(errorMessage, 'stderr');
            }
            
        } catch (error) {
            this.appendOutput(`Runtime Error: ${error.message}`, 'stderr');
            console.error('Code execution error:', error);
        } finally {
            this.isRunning = false;
            this.showLoading(false);
            this.updateRunButton(false);
            this.appendOutput('>>> Execution complete.', 'system');
        }
    }
    
    formatPythonError(error) {
        try {
            // Extract the Python traceback
            const errorStr = error.toString();
            
            // Try to get a cleaner error message
            if (errorStr.includes('Traceback')) {
                return errorStr;
            } else {
                return `Error: ${errorStr}`;
            }
        } catch (e) {
            return `Error: ${error.message || error}`;
        }
    }
    
    appendOutput(content, type = 'stdout') {
        const outputLine = document.createElement('div');
        outputLine.className = `output-line ${type}`;
        
        // Add timestamp for system messages
        if (type === 'system') {
            const timestamp = new Date().toLocaleTimeString();
            outputLine.textContent = `[${timestamp}] ${content}`;
        } else {
            outputLine.textContent = content;
        }
        
        this.outputElement.appendChild(outputLine);
        
        // Scroll to bottom
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
        
        // Limit output lines to prevent memory issues
        const maxLines = 1000;
        const lines = this.outputElement.children;
        if (lines.length > maxLines) {
            for (let i = 0; i < lines.length - maxLines; i++) {
                this.outputElement.removeChild(lines[0]);
            }
        }
    }
    
    clearOutput() {
        this.outputElement.innerHTML = '';
        this.appendOutput('Output cleared.', 'system');
    }
    
    showLoading(show) {
        this.loadingIndicator.style.display = show ? 'flex' : 'none';
    }
    
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    updateStatus(message) {
        this.statusElement.textContent = message;
    }
    
    updateRunButton(isRunning) {
        const runBtn = document.getElementById('runBtn');
        const icon = runBtn.querySelector('i');
        
        if (isRunning) {
            icon.className = 'fas fa-spinner fa-spin';
            runBtn.disabled = true;
        } else {
            icon.className = 'fas fa-play';
            runBtn.disabled = false;
        }
    }
    
    installPackage(packageName) {
        if (this.isLoading) {
            this.appendOutput('Python environment is still loading. Please wait...', 'system');
            return;
        }
        
        this.appendOutput(`Installing package: ${packageName}`, 'system');
        
        try {
            this.pyodide.loadPackage(packageName).then(() => {
                this.appendOutput(`Successfully installed: ${packageName}`, 'system');
            }).catch(error => {
                this.appendOutput(`Failed to install ${packageName}: ${error.message}`, 'stderr');
            });
        } catch (error) {
            this.appendOutput(`Failed to install ${packageName}: ${error.message}`, 'stderr');
        }
    }
    
    getAvailablePackages() {
        if (this.pyodide) {
            return this.pyodide.loadedPackages;
        }
        return {};
    }
    
    isReady() {
        return !this.isLoading && this.pyodide !== null;
    }
}

// Initialize Python runner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pythonRunner = new PythonRunner();
});
