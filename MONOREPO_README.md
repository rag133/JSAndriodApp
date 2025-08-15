# Jeevan Saathi Monorepo

This is a monorepo containing the Jeevan Saathi application with web, mobile, and shared packages.

## 📁 Project Structure

```
jeevan-saathi-monorepo/
├── shared/           # Shared code, types, and utilities
├── web/             # Web application (React + Vite)
├── mobile/          # Mobile application (React Native)
└── docs/            # Documentation and ADRs
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 8
- React Native CLI (for mobile development)
- Android Studio / Xcode (for mobile development)

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Build shared package:**
   ```bash
   npm run build:shared
   ```

## 📦 Available Scripts

### Root Level Commands
- `npm run dev` - Start all development servers concurrently
- `npm run build` - Build shared package and web app
- `npm run test` - Run tests for all packages
- `npm run lint` - Lint all packages
- `npm run clean` - Clean all build artifacts and node_modules

### Package-Specific Commands
- `npm run dev:web` - Start web development server
- `npm run dev:mobile` - Start React Native Metro bundler
- `npm run dev:shared` - Watch and build shared package
- `npm run build:web` - Build web application
- `npm run build:mobile` - Build mobile application
- `npm run build:shared` - Build shared package

## 🔧 Development Workflow

### 1. Shared Package Development
The shared package contains:
- **Types**: Common TypeScript interfaces
- **Stores**: Zustand state management
- **Services**: Data and business logic
- **Utils**: Helper functions

**To modify shared code:**
1. Make changes in `shared/src/`
2. Run `npm run dev:shared` to watch for changes
3. Changes are automatically built to `shared/dist/`

### 2. Web Application Development
- Built with React 19 + Vite
- Uses shared package for common functionality
- Import from `@jeevan-saathi/shared`

### 3. Mobile Application Development
- Built with React Native 0.80.2
- Uses shared package for common functionality
- Import from `@jeevan-saathi/shared`

## 📱 Mobile Development

### Android
```bash
cd mobile
npm run android
```

### iOS
```bash
cd mobile
npm run ios
```

## 🌐 Web Development

```bash
cd web
npm run dev
```

## 🧪 Testing

### Run all tests
```bash
npm run test
```

### Run specific package tests
```bash
npm run test:web
npm run test:mobile
```

## 🏗️ Building

### Build all packages
```bash
npm run build
```

### Build specific packages
```bash
npm run build:shared
npm run build:web
npm run build:mobile
```

## 🔍 Troubleshooting

### Common Issues

1. **Shared package not found**
   - Ensure shared package is built: `npm run build:shared`
   - Check that workspace dependencies are properly configured

2. **TypeScript errors**
   - Run `npm run build:shared` to ensure types are generated
   - Check path mappings in tsconfig.json files

3. **Dependency conflicts**
   - Run `npm run clean:all` then `npm run install:all`
   - Check version resolutions in root package.json

### Clean Build
```bash
npm run clean:all
npm run install:all
npm run build:shared
npm run build
```

## 📚 Package Dependencies

### Shared Package
- **zustand**: State management
- **firebase**: Peer dependency (platform-specific implementations)

### Web Package
- **React 19**: UI framework
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **@jeevan-saathi/shared**: Shared functionality

### Mobile Package
- **React Native 0.80.2**: Mobile framework
- **@jeevan-saathi/shared**: Shared functionality
- **React Navigation**: Navigation
- **React Native Paper**: UI components

## 🔄 Version Management

The monorepo uses version resolutions to ensure consistent dependencies:
- React: 19.1.0
- TypeScript: 5.5.3
- Zustand: 5.0.7

## 📝 Contributing

1. Make changes in the appropriate package
2. Ensure shared package is built if making changes there
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Build to verify: `npm run build`

## 🚨 Important Notes

- Always build the shared package before building web/mobile
- Use workspace dependencies (`workspace:*`) for internal packages
- Keep dependency versions aligned across packages
- Run `npm run clean:all` if encountering build issues
