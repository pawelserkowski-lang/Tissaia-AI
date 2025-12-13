#!/usr/bin/env python3
"""
Tissaia AI - All-in-One Launcher
================================
This script handles:
- Requirements checking (Node.js, Chrome)
- Dependency installation
- Development server startup
- Comprehensive logging (startup, debug, chat)
- Chrome app mode launching
- System tray integration
"""

import os
import sys
import subprocess
import time
import platform
import shutil
import json
import logging
import signal
from pathlib import Path
from datetime import datetime
from threading import Thread
import webbrowser
import urllib.request
import urllib.error

# Try to import system tray library (optional)
try:
    import pystray
    from PIL import Image, ImageDraw
    TRAY_AVAILABLE = True
except ImportError:
    TRAY_AVAILABLE = False
    print("⚠️  System tray not available. Install with: pip install pystray pillow")

class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

class TissaiaLauncher:
    """Main launcher class for Tissaia AI application"""

    def __init__(self):
        self.root_dir = Path(__file__).parent.absolute()
        self.logs_dir = self.root_dir / "logs"
        self.logs_dir.mkdir(exist_ok=True)

        # Log files
        self.startup_log = self.logs_dir / f"startup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        self.debug_log = self.logs_dir / "debug.log"
        self.chat_log = self.logs_dir / "chat.log"

        # Process handles
        self.dev_server_process = None
        self.chrome_process = None
        self.tray_icon = None

        # Server configuration
        self.dev_server_url = "http://localhost:5173"
        self.dev_server_port = 5173

        # Setup logging
        self.setup_logging()

    def setup_logging(self):
        """Configure comprehensive logging system"""
        # Main logger
        self.logger = logging.getLogger('TissaiaLauncher')
        self.logger.setLevel(logging.DEBUG)

        # File handler for startup log
        startup_handler = logging.FileHandler(self.startup_log, encoding='utf-8')
        startup_handler.setLevel(logging.DEBUG)
        startup_formatter = logging.Formatter(
            '%(asctime)s [%(levelname)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        startup_handler.setFormatter(startup_formatter)

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter('%(message)s')
        console_handler.setFormatter(console_formatter)

        self.logger.addHandler(startup_handler)
        self.logger.addHandler(console_handler)

        # Debug logger
        self.debug_logger = logging.getLogger('TissaiaDebug')
        self.debug_logger.setLevel(logging.DEBUG)
        debug_handler = logging.FileHandler(self.debug_log, encoding='utf-8')
        debug_handler.setFormatter(startup_formatter)
        self.debug_logger.addHandler(debug_handler)

        # Chat logger
        self.chat_logger = logging.getLogger('TissaiaChat')
        self.chat_logger.setLevel(logging.INFO)
        chat_handler = logging.FileHandler(self.chat_log, encoding='utf-8')
        chat_formatter = logging.Formatter(
            '%(asctime)s %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        chat_handler.setFormatter(chat_formatter)
        self.chat_logger.addHandler(chat_handler)

    def print_banner(self):
        """Display startup banner"""
        banner = f"""
{Colors.CYAN}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ████████╗██╗███████╗███████╗ █████╗ ██╗ █████╗        ║
║   ╚══██╔══╝██║██╔════╝██╔════╝██╔══██╗██║██╔══██╗       ║
║      ██║   ██║███████╗███████╗███████║██║███████║       ║
║      ██║   ██║╚════██║╚════██║██╔══██║██║██╔══██║       ║
║      ██║   ██║███████║███████║██║  ██║██║██║  ██║       ║
║      ╚═╝   ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝       ║
║                                                           ║
║              Architect Engine - All-in-One Launcher      ║
║                    Photo Restoration AI                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝{Colors.END}
"""
        print(banner)
        self.logger.info("Tissaia AI Launcher started")
        self.logger.info(f"Working directory: {self.root_dir}")
        self.logger.info(f"Platform: {platform.system()} {platform.release()}")
        self.logger.info(f"Python: {sys.version.split()[0]}")

    def check_node(self):
        """Check if Node.js is installed"""
        self.logger.info(f"\n{Colors.BOLD}[1/6] Checking Node.js...{Colors.END}")

        try:
            result = subprocess.run(
                ['node', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode == 0:
                version = result.stdout.strip()
                self.logger.info(f"  ✓ Node.js {version} {Colors.GREEN}found{Colors.END}")
                self.debug_logger.debug(f"Node.js version: {version}")
                return True
            else:
                raise FileNotFoundError

        except (FileNotFoundError, subprocess.TimeoutExpired):
            self.logger.error(f"  ✗ {Colors.RED}Node.js not found!{Colors.END}")
            self.logger.error(f"  Please install Node.js from: https://nodejs.org/")
            return False

    def check_npm(self):
        """Check if npm is installed"""
        try:
            result = subprocess.run(
                ['npm', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode == 0:
                version = result.stdout.strip()
                self.logger.info(f"  ✓ npm {version} {Colors.GREEN}found{Colors.END}")
                self.debug_logger.debug(f"npm version: {version}")
                return True
            else:
                raise FileNotFoundError

        except (FileNotFoundError, subprocess.TimeoutExpired):
            self.logger.error(f"  ✗ {Colors.RED}npm not found!{Colors.END}")
            return False

    def check_chrome(self):
        """Check if Chrome/Chromium is installed"""
        self.logger.info(f"\n{Colors.BOLD}[2/6] Checking Chrome/Chromium...{Colors.END}")

        chrome_paths = []

        if platform.system() == "Windows":
            chrome_paths = [
                r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
            ]
        elif platform.system() == "Darwin":  # macOS
            chrome_paths = [
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                "/Applications/Chromium.app/Contents/MacOS/Chromium",
            ]
        else:  # Linux
            chrome_paths = [
                "/usr/bin/google-chrome",
                "/usr/bin/chromium",
                "/usr/bin/chromium-browser",
                "/snap/bin/chromium",
            ]

        for path in chrome_paths:
            if os.path.exists(path):
                self.chrome_path = path
                self.logger.info(f"  ✓ Chrome {Colors.GREEN}found{Colors.END}: {path}")
                self.debug_logger.debug(f"Chrome path: {path}")
                return True

        self.logger.warning(f"  ⚠️  {Colors.YELLOW}Chrome not found{Colors.END} - will use default browser")
        self.chrome_path = None
        return True  # Don't fail, just use default browser

    def check_dependencies(self):
        """Check if node_modules exists"""
        self.logger.info(f"\n{Colors.BOLD}[3/6] Checking dependencies...{Colors.END}")

        node_modules = self.root_dir / "node_modules"

        if node_modules.exists():
            self.logger.info(f"  ✓ Dependencies {Colors.GREEN}already installed{Colors.END}")
            return True
        else:
            self.logger.warning(f"  ⚠️  {Colors.YELLOW}Dependencies not found{Colors.END}")
            return False

    def install_dependencies(self):
        """Install npm dependencies"""
        self.logger.info(f"\n{Colors.BOLD}[4/6] Installing dependencies...{Colors.END}")
        self.logger.info(f"  This may take a few minutes...")

        try:
            # Create a log file for npm install output
            npm_log = self.logs_dir / "npm_install.log"

            with open(npm_log, 'w') as log_file:
                process = subprocess.Popen(
                    ['npm', 'install'],
                    cwd=self.root_dir,
                    stdout=log_file,
                    stderr=subprocess.STDOUT,
                    text=True
                )

                # Show progress indicator
                chars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
                i = 0
                while process.poll() is None:
                    print(f"\r  {chars[i % len(chars)]} Installing...", end='', flush=True)
                    i += 1
                    time.sleep(0.1)

                print(f"\r  ", end='')  # Clear spinner

                if process.returncode == 0:
                    self.logger.info(f"  ✓ Dependencies {Colors.GREEN}installed successfully{Colors.END}")
                    self.debug_logger.debug("npm install completed successfully")
                    return True
                else:
                    self.logger.error(f"  ✗ {Colors.RED}Installation failed{Colors.END}")
                    self.logger.error(f"  Check log: {npm_log}")
                    return False

        except Exception as e:
            self.logger.error(f"  ✗ {Colors.RED}Error: {e}{Colors.END}")
            self.debug_logger.exception("npm install failed")
            return False

    def check_env_file(self):
        """Check and setup .env file"""
        self.logger.info(f"\n{Colors.BOLD}[5/6] Checking configuration...{Colors.END}")

        env_file = self.root_dir / ".env"

        if env_file.exists():
            # Check if API key is set
            with open(env_file, 'r') as f:
                content = f.read()
                if 'API_KEY=' in content and not content.startswith('API_KEY=\n'):
                    self.logger.info(f"  ✓ Configuration {Colors.GREEN}found{Colors.END}")
                    return True

        # Prompt for API key
        self.logger.warning(f"  ⚠️  {Colors.YELLOW}Google Gemini API key not configured{Colors.END}")
        print(f"\n  {Colors.CYAN}Get your free API key at: https://makersuite.google.com/app/apikey{Colors.END}")
        print(f"  {Colors.YELLOW}Press Enter to skip and use demo mode{Colors.END}\n")

        api_key = input("  Enter your API key: ").strip()

        if api_key:
            with open(env_file, 'w') as f:
                f.write(f"API_KEY={api_key}\n")
            self.logger.info(f"  ✓ API key {Colors.GREEN}saved{Colors.END}")
            self.debug_logger.debug("API key configured")
        else:
            self.logger.info(f"  → Running in {Colors.YELLOW}demo mode{Colors.END}")
            with open(env_file, 'w') as f:
                f.write("API_KEY=\n")

        return True

    def wait_for_server(self, timeout=30):
        """Wait for development server to be ready"""
        self.logger.info(f"  Waiting for server to start...")

        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                urllib.request.urlopen(self.dev_server_url, timeout=1)
                self.logger.info(f"  ✓ Server {Colors.GREEN}ready{Colors.END} at {self.dev_server_url}")
                self.debug_logger.debug(f"Server responded at {self.dev_server_url}")
                return True
            except (urllib.error.URLError, ConnectionError, TimeoutError):
                time.sleep(0.5)

        self.logger.error(f"  ✗ {Colors.RED}Server failed to start{Colors.END}")
        return False

    def start_dev_server(self):
        """Start the Vite development server"""
        self.logger.info(f"\n{Colors.BOLD}[6/6] Starting development server...{Colors.END}")

        try:
            # Create log file for server output
            server_log = self.logs_dir / "server.log"
            server_log_file = open(server_log, 'w')

            self.dev_server_process = subprocess.Popen(
                ['npm', 'run', 'dev'],
                cwd=self.root_dir,
                stdout=server_log_file,
                stderr=subprocess.STDOUT,
                text=True
            )

            self.debug_logger.debug(f"Dev server started with PID: {self.dev_server_process.pid}")
            self.logger.info(f"  Server output: {server_log}")

            # Wait for server to be ready
            if self.wait_for_server():
                return True
            else:
                self.stop_dev_server()
                return False

        except Exception as e:
            self.logger.error(f"  ✗ {Colors.RED}Failed to start server: {e}{Colors.END}")
            self.debug_logger.exception("Failed to start dev server")
            return False

    def launch_chrome_app(self):
        """Launch Chrome in app mode"""
        self.logger.info(f"\n{Colors.BOLD}Launching Chrome App...{Colors.END}")

        try:
            if self.chrome_path:
                # Launch in app mode (no browser UI)
                cmd = [
                    self.chrome_path,
                    f"--app={self.dev_server_url}",
                    "--window-size=1280,800",
                    "--disable-extensions",
                    "--disable-plugins",
                ]

                self.chrome_process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )

                self.logger.info(f"  ✓ Chrome app {Colors.GREEN}launched{Colors.END}")
                self.debug_logger.debug(f"Chrome launched with PID: {self.chrome_process.pid}")
            else:
                # Use default browser
                webbrowser.open(self.dev_server_url)
                self.logger.info(f"  ✓ Browser {Colors.GREEN}opened{Colors.END}")

            # Log the launch event
            self.chat_logger.info(f"[SYSTEM] Application launched at {self.dev_server_url}")

            return True

        except Exception as e:
            self.logger.error(f"  ✗ {Colors.RED}Failed to launch: {e}{Colors.END}")
            self.debug_logger.exception("Failed to launch Chrome")
            return False

    def create_tray_icon(self):
        """Create system tray icon"""
        if not TRAY_AVAILABLE:
            return None

        # Create a simple icon image
        def create_icon_image():
            # Create a 64x64 image with a "T" letter
            image = Image.new('RGB', (64, 64), color=(0, 204, 204))  # Cyan background
            dc = ImageDraw.Draw(image)
            dc.rectangle([20, 10, 44, 20], fill=(255, 255, 255))  # Top of T
            dc.rectangle([28, 20, 36, 54], fill=(255, 255, 255))  # Stem of T
            return image

        # Menu actions
        def show_logs():
            """Open logs directory"""
            if platform.system() == "Windows":
                os.startfile(self.logs_dir)
            elif platform.system() == "Darwin":
                subprocess.run(['open', self.logs_dir])
            else:
                subprocess.run(['xdg-open', self.logs_dir])

        def quit_app(icon, item):
            """Quit application"""
            self.logger.info(f"\n{Colors.YELLOW}Shutting down...{Colors.END}")
            self.chat_logger.info("[SYSTEM] Application shutdown initiated by user")
            icon.stop()
            self.cleanup()

        # Create menu
        menu = pystray.Menu(
            pystray.MenuItem("Tissaia AI", lambda: None, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Open Logs", show_logs),
            pystray.MenuItem("Quit", quit_app)
        )

        # Create icon
        icon = pystray.Icon(
            "tissaia",
            create_icon_image(),
            "Tissaia AI - Running",
            menu
        )

        return icon

    def run_in_tray(self):
        """Run application in system tray"""
        if TRAY_AVAILABLE:
            self.logger.info(f"\n{Colors.GREEN}✓ Application running in system tray{Colors.END}")
            self.logger.info(f"  Right-click tray icon for options")

            self.tray_icon = self.create_tray_icon()
            if self.tray_icon:
                self.tray_icon.run()
        else:
            self.logger.info(f"\n{Colors.GREEN}✓ Application running{Colors.END}")
            self.logger.info(f"  Press Ctrl+C to stop")

            # Keep running until interrupted
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                self.logger.info(f"\n{Colors.YELLOW}Shutting down...{Colors.END}")

    def stop_dev_server(self):
        """Stop the development server"""
        if self.dev_server_process:
            try:
                self.dev_server_process.terminate()
                self.dev_server_process.wait(timeout=5)
                self.debug_logger.debug("Dev server stopped")
            except subprocess.TimeoutExpired:
                self.dev_server_process.kill()
                self.debug_logger.debug("Dev server killed (force)")

    def cleanup(self):
        """Cleanup processes and resources"""
        self.chat_logger.info("[SYSTEM] Application shutdown")

        self.stop_dev_server()

        if self.chrome_process:
            try:
                self.chrome_process.terminate()
                self.debug_logger.debug("Chrome process terminated")
            except:
                pass

        self.logger.info(f"  ✓ Cleanup complete")
        sys.exit(0)

    def run(self):
        """Main launch sequence"""
        try:
            self.print_banner()

            # Check requirements
            if not self.check_node() or not self.check_npm():
                return False

            self.check_chrome()

            # Check and install dependencies
            if not self.check_dependencies():
                if not self.install_dependencies():
                    return False

            # Setup configuration
            if not self.check_env_file():
                return False

            # Start server
            if not self.start_dev_server():
                return False

            # Launch browser
            if not self.launch_chrome_app():
                return False

            # Success
            self.logger.info(f"\n{Colors.GREEN}{Colors.BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.END}")
            self.logger.info(f"{Colors.GREEN}{Colors.BOLD}  ✓ TISSAIA AI READY{Colors.END}")
            self.logger.info(f"{Colors.GREEN}{Colors.BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.END}\n")
            self.logger.info(f"  {Colors.CYAN}URL:{Colors.END} {self.dev_server_url}")
            self.logger.info(f"  {Colors.CYAN}Logs:{Colors.END} {self.logs_dir}")
            self.logger.info(f"  {Colors.CYAN}Startup Log:{Colors.END} {self.startup_log}")
            self.logger.info(f"  {Colors.CYAN}Debug Log:{Colors.END} {self.debug_log}")
            self.logger.info(f"  {Colors.CYAN}Chat Log:{Colors.END} {self.chat_log}\n")

            # Run in tray or foreground
            self.run_in_tray()

            return True

        except KeyboardInterrupt:
            self.logger.info(f"\n{Colors.YELLOW}Interrupted by user{Colors.END}")
            self.cleanup()
            return False

        except Exception as e:
            self.logger.error(f"\n{Colors.RED}Fatal error: {e}{Colors.END}")
            self.debug_logger.exception("Fatal error in launcher")
            self.cleanup()
            return False

def main():
    """Entry point"""
    launcher = TissaiaLauncher()
    success = launcher.run()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
