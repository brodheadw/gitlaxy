Inspired by Gitlantis, Gitlaxy creates a 3-Dimensional, traversable point cloud of each file and folder in your repository.

## Features

- 🌌 3D visualization of your Git repository
- 🚀 Fly mode with customizable ship controls
- ⚙️ Settings menu for flight control customization
- 📊 FPS counter for performance monitoring
- 🔴 Clean shutdown button to properly exit the application

## Clean Shutdown

Gitlaxy now includes a proper shutdown mechanism to ensure all localhost servers are properly terminated:

### In-App Exit Button

Click the "**⏻ Exit**" button in the top-right corner of the HUD to cleanly exit the application. This will:
- Display a confirmation dialog
- Clean up all browser resources
- Close the application window

### Manual Server Cleanup

If you close the browser window directly and notice lingering localhost servers, you can manually clean them up:

```bash
npm run kill-servers
```

This script will:
- Check common development ports (3000, 4173, 5173, 8080)
- Kill any Vite or Node.js processes associated with the project
- Ensure all localhost servers are properly terminated

### Automatic Cleanup on Close

The application also performs automatic cleanup when the window is closed, including:
- Clearing session storage
- Canceling pending animations and timers
- Releasing browser resources

