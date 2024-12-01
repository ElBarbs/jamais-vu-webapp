# Jamais Vu - Web Application

## Overview
Jamais Vu is an interactive installation project designed to evoke the sensation of unfamiliarity with familiar environments through soundscapes. This application allows us to collects crowdsourced audio samples from across Montreal and to visualize them on a map.

## Project Structure

### Components
- **Button**: ShadCN UI button component.
- **Menu**: ShadCN UI menu component.
- **Waveform**: Displays an audio waveform using WaveSurfer.js.
- **Recorder**: Manages audio recording, playback, and uploading.
- **Screws**: Displays decorative screws.
- **SpeakerGrid**: Displays decorative speaker grid.
- **Header**: Displays the header with the title and navigation menu.
- **Heatmap**: Displays a heatmap of audio recordings on a map.

### Lib
- **Utils**: Contains utility functions like `cn` for class name merging.

### Pages
- **_app**: Custom App component for Next.js.
- **index**: Home page with the recorder component.
- **explore**: Explore page with the heatmap component.
- **about**: About page with project information.
- **api/trpc**: tRPC API handler.

### Server
- **API Root**: Main router for the server, combining different API routers.
- **API Routers**: Contains specific API routes, e.g., for IBM services.

### Styles
- **Globals**: Global CSS styles.
- **Fonts**: Font loader for custom fonts.

### Utils
- **API**: Client-side entry point for the tRPC API.

### Definitions
- **RecordingDocument**: Type definitions for recording documents.

