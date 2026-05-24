<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# KNC Language School

A modern, responsive landing page for KNC Language School offering English and Thai language courses. Built with React, TypeScript, Vite, and Tailwind CSS with smooth animations powered by Motion.

## Features

- **Modern, Responsive Design**: Mobile-first approach with beautiful UI/UX
- **Course Information**: Display of available English and Thai language courses
- **Interactive Components**: Smooth animations and transitions using Motion
- **Contact Form**: Easy way for prospective students to get in touch
- **Gemini AI Integration**: Powered by Google Gemini API for smart features
- **Fast Performance**: Built with Vite for lightning-fast development and production builds
- **Accessibility**: Semantic HTML and keyboard navigation support

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4 with Vite plugin
- **Icons**: Lucide React
- **Animations**: Motion (React Motion Library)
- **AI**: Google Generative AI SDK
- **Development**: TypeScript, Autoprefixer
- **Server**: Express (optional)

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create or update your `.env.local` file with your Gemini API key:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Refer to `.env.example` for template variables.

### 3. Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check TypeScript types without emitting |
| `npm run clean` | Remove dist and server.js files |

## Project Structure

```
src/
├── App.tsx           # Main application component
├── main.tsx          # Entry point
├── constants.ts      # Configuration and constants
├── index.css         # Global styles
```

Key components in `App.tsx`:
- **Navbar**: Navigation with mobile menu
- **Hero Section**: Eye-catching landing section
- **Courses Section**: Display of available courses
- **Features Section**: School highlights and benefits
- **Contact Section**: Get in touch form
- **Footer**: Footer information

## Configuration

- **Vite Config**: `vite.config.ts` - Build and dev server configuration
- **TypeScript Config**: `tsconfig.json` - TypeScript compiler options
- **Tailwind Config**: Integrated through Vite plugin

## Building for Production

```bash
npm run build
```

This creates an optimized production bundle in the `dist/` directory.

## Deployment

The app is built as a static site and can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## License

SPDX-License-Identifier: Apache-2.0

## Support

For questions or issues, please contact KNC Language School through the contact form on the website.
