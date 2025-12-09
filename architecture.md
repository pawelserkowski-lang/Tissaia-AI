# Architecture Documentation

## Project Structure
The application follows a standard React component-based architecture, flattened for the current implementation phase.

- `/components`: Contains all UI components (Views, Navigation, Widgets).
  - `Launcher.tsx`: Handles the initial boot sequence and login.
  - `Sidebar.tsx`: Main navigation controller.
  - `FileListView.tsx`: Data ingestion and management view.
  - `CropMapView.tsx`: Detailed analysis view.
  - `MagicSpellView.tsx`: Results and output view.
  - `Tooltip.tsx`: Reusable UI utility.
- `/types.ts`: TypeScript definitions for domain entities (ScanFile, DetectedCrop, etc.).
- `/data`: Static mock data (`mockData.ts`) used to populate the UI for prototyping.

## Core Concepts

### State Management
`App.tsx` acts as the central controller and state manager for the application:
- **Authentication**: Manages the `isAuthenticated` state, transitioning from the `Launcher` to the main dashboard.
- **Navigation**: Controls the `activeView` state (`FILES`, `CROP_MAP`, `MAGIC_SPELL`) to render the appropriate main component.
- **File Repository**: Maintains the list of `files` and handles the "upload" logic (currently simulated with timeouts).
- **Resource Management**: Handles the creation and revocation of `objectURL`s for file previews to prevent memory leaks.

### Data Flow
1. **Ingestion**: User uploads a file via Drag & Drop or System Dialog -> `App.tsx` creates a `ScanFile` object with a blob preview -> `FileListView` renders the new entry.
2. **Processing Simulation**: The system simulates "Scanning" by updating the file status from `UPLOADING` -> `DETECTING` -> `CROPPED` via `setInterval` in `App.tsx`.
3. **Analysis**: User selects a file -> `activeView` switches to `CROP_MAP` -> `CropMapView` renders the specific file and its detected regions (mocked).
4. **Output**: `MagicSpellView` displays the final processed artifacts.

### Design System & Styling
The application uses **Tailwind CSS** for all styling, configured via `tailwind.config` in `index.html`.
- **Colors**: Custom palette extensions (`tissaia-accent`, `gray-950`) ensure consistency.
- **Glassmorphism**: Heavy use of `backdrop-blur` and semi-transparent backgrounds (`rgba(0,0,0,0.6)`) to create depth and a modern "HUD" feel.
- **Animations**: CSS animations (`animate-scan-vertical`, `animate-fade-in`) are defined in the global `<style>` block in `index.html` to handle the boot sequence effects.

## Future Considerations
- **Backend Integration**: Replace `mockData.ts` and simulated uploads with actual API calls to a Python/Node.js backend.
- **AI Integration**: Connect `CropMapView` to a real segmentation model (e.g., SAM or YOLO) and `MagicSpellView` to a diffusion model pipeline.
