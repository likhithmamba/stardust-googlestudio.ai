# Stardust Canvas

Stardust Canvas is an infinite, cosmic-themed spatial note-taking application designed to let your thoughts orbit freely. Ditch the linear document for a universe of ideas.

![Stardust Preview](https://via.placeholder.com/800x450?text=Stardust+Canvas+Preview)

## ✨ Features

*   **Infinite Canvas**: Pan and zoom through an endless starfield.
*   **Cosmic Nodes**: distinct celestial bodies (Planets, Suns, Asteroids) act as your note containers.
*   **Spatial Linking**: Connect ideas with gravitational tethers (bezier curves).
*   **Rich Text Styling**: Customize font color, size, and family within your planets.
*   **Focus Mode**: Double-click "warp" to specific notes.
*   **Soundscapes**: Generative ambient layout sounds (clicks, warps, connections).
*   **Local First**: All data persists locally in your browser using IndexedDB.

## 🚀 Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/stardust-canvas.git
    cd stardust-canvas
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Build for Production**
    ```bash
    npm run build
    ```

## 🎮 How to Use

*   **Create**: Double-click anywhere on the canvas (empty space) to open the Celestial Body menu. Choose a planet type to add it.
*   **Edit**: Double-click a planet to edit its text.
*   **Connect**: Drag from the white "handle" (dot) that appears when hovering a planet to another planet to create a link.
*   **Organize**: Drag planets to rearrange your solar system of ideas.
*   **Delete**: Select a planet and press `Delete`/`Backspace`, or use the Black Hole (drag a planet constantly to the bottom-right corner to warp it into oblivion).
*   **Toolbar**:
    *   **Palette**: Change Font Color, Style, and Size.
    *   **Plus (+)**: Quickly add a "Sun" (Central Idea).
    *   **Map**: Toggle Minimap.
    *   **Share**: Toggle Connection Lines.

## 🛠️ Tech Stack

*   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Interactions**: [@use-gesture/react](https://use-gesture.netlify.app/)
*   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)

## 📄 License

MIT License. Feel free to fork and build your own universe!
