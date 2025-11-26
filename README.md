Inspired by Gitlantis, Gitlaxy creates a 3-Dimensional, traversable point cloud of each file and folder in your repository.

## Features

- 3D visualization of your Git repository
- Fly mode with customizable ship controls
- Settings menu for flight control customization
- FPS counter for performance monitoring
- Clean shutdown button to properly exit the application
- Optimized 3D models with Draco compression (83% file size reduction)

## Clean Shutdown

Gitlaxy now includes a proper shutdown mechanism to ensure all localhost servers are properly terminated:

### In-App Exit Button

Click the "**Exit**" button in the top-right corner of the HUD to cleanly exit the application. This will:
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

## 3D Model Optimization

Gitlaxy uses Draco compression to optimize 3D models for fast loading and improved performance.

### Model Compression Pipeline

The spaceship model is compressed using gltf-transform with Draco compression, reducing file size by ~83% (78.46 MB → 13.5 MB).

### Re-optimize Models

To re-optimize the spaceship model after updates:

```bash
npm run optimize-model
```

### How It Works

1. **Build-time**: Draco decoder files are automatically copied to `public/draco/` during `npm install` and `npm run build`
2. **Runtime**: The DRACOLoader decompresses the model on-the-fly in the browser
3. **Result**: Fast loading times without sacrificing model quality

### Adding New Models

To add your own 3D models:

1. Place the original `.glb` file in the `public/` directory
2. Update the `optimize-model` script in `package.json` to point to your model
3. Run `npm run optimize-model`
4. Update the model path in `src/components/Spaceship.tsx`

