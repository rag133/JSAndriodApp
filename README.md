# Jeevan Saathi - Your Life Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.0+-orange.svg)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-purple.svg)](https://vitejs.dev/)

<!-- Replace with a real screenshot -->
<div align="center">
  <img src="Jeevan_Saathi_Logo.png" alt="Jeevan Saathi Logo" width="200"/>
  <h3>जीवन साथी - Life Companion</h3>
</div>

Jeevan Saathi is a comprehensive personal management application designed to help users organize their lives across various dimensions: tasks, journaling, goal setting, and learning. Built with a modular architecture, it aims to provide a holistic platform for personal growth and productivity.

## ✨ Features

Jeevan Saathi is divided into four main modules:

### 📝 Kary (कार्य - Work/Tasks)
A powerful task manager that helps you organize your to-do lists, set due dates, and track your progress. You can create custom lists, add tags, and break down large tasks into smaller subtasks.

**Key Features:**
- Smart task prioritization with AI suggestions
- Automatic task breakdown for complex projects
- Custom lists and tagging system
- Subtask management
- Due date tracking and reminders

### 🎯 Abhyasa (अभ्यास - Practice/Habits)
A habit tracker that helps you build and maintain good habits. You can set goals, track your progress with a calendar view, and get detailed statistics on your habit completion rate.

**Key Features:**
- Personalized habit coaching with AI insights
- Habit prediction and intervention
- Calendar heatmap visualization
- Goal setting and milestone tracking
- Progress analytics and statistics

### 📔 Dainandini (दैनंदिनी - Journal)
A personal journal for your thoughts, reflections, and daily logs. You can create different types of entries (text, checklists, ratings) and organize them by focus areas.

**Key Features:**
- Sentiment analysis and mood tracking
- Automatic summarization and key insight extraction
- Journal analysis for goal and habit suggestions
- Multiple entry types (text, checklists, ratings)
- Focus area organization

### 📚 Vidya (विद्या - Knowledge)
A knowledge base for learning and growth. This module is currently under development and will include personalized learning recommendations and knowledge synthesis.

**Planned Features:**
- Personalized learning recommendations
- Knowledge synthesis and Q&A
- Progress tracking for learning goals
- Resource management and organization

### 🏠 Home Dashboard
A centralized dashboard that provides a unified view of your tasks, habits, and journal entries for the day. It's designed to help you plan and prioritize your day effectively.

**Key Features:**
- Dynamic daily plan generation with AI
- Proactive life insights and patterns
- Unified calendar view
- Quick actions and smart notifications

## 🚀 Tech Stack

Jeevan Saathi is built with a modern and robust tech stack:

### Frontend
- **[React 18+](https://reactjs.org/)** - Modern React with hooks and functional components
- **[Vite](https://vitejs.dev/)** - Fast build tool and development server
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript

### State Management
- **[Zustand](https://github.com/pmndrs/zustand)** - Lightweight state management

### Backend & Services
- **[Firebase](https://firebase.google.com/)** - Authentication, Firestore database, hosting
- **[Firestore](https://firebase.google.com/docs/firestore)** - NoSQL cloud database

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[React Testing Library](https://testing-library.com/)** - Component testing

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rag133/jeevan-saathi-master.git
   cd jeevan-saathi-master
   ```

2. **Install dependencies**
   ```bash
   # For web application
   cd web
   npm install
   
   # For mobile application
   cd ../mobile
   npm install
   
   # For shared components
   cd ../shared
   npm install
   ```

3. **Set up Firebase**
   - Create a new project on the [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Firestore
   - Create a `.env.local` file in the `web` directory with your Firebase configuration:
     ```env
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
     VITE_FIREBASE_APP_ID=your-app-id
     ```

4. **Run the development server**
   ```bash
   # Web application
   cd web
   npm run dev
   
   # Mobile application (requires React Native setup)
   cd ../mobile
   npm start
   ```

## 📂 Project Structure

The project follows a modular architecture, with each main feature separated into its own directory:

```
jeevan-saathi-master/
├── web/                          # Web application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── modules/              # Feature modules
│   │   │   ├── abhyasa/         # Habit tracking module
│   │   │   ├── dainandini/      # Journaling module
│   │   │   ├── home/            # Dashboard module
│   │   │   ├── kary/            # Task management module
│   │   │   └── vidya/           # Knowledge module
│   │   ├── services/            # API and external services
│   │   ├── types/               # TypeScript type definitions
│   │   └── App.tsx              # Main application component
│   ├── package.json
│   └── vite.config.ts
├── mobile/                       # React Native mobile app
│   ├── android/                  # Android-specific files
│   ├── ios/                     # iOS-specific files
│   ├── src/                     # Mobile app source code
│   └── package.json
├── shared/                       # Shared components and utilities
│   ├── components/              # Common UI components
│   ├── services/                # Shared services
│   ├── stores/                  # Shared state management
│   ├── types/                   # Shared type definitions
│   └── utils/                   # Utility functions
├── docs/                        # Documentation and ADRs
└── README.md
```

## 🧠 State Management with Zustand

Jeevan Saathi uses [Zustand](https://github.com/pmndrs/zustand) for global state management. This provides a simple and scalable way to manage state across the application.

### Architecture
- **Root Store:** A root store combines the state and actions from all individual module stores
- **Module Stores:** Each module (`kary`, `dainandini`, `abhyasa`) has its own store that manages the state for that module
- **Shared Stores:** Common functionality is shared across modules through dedicated stores

### Benefits
- Lightweight and performant
- Simple API with hooks
- Easy testing and debugging
- Modular state organization

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run tests for web application
cd web
npm test

# Run tests for shared components
cd ../shared
npm test
```

## 🚀 Deployment

### Web Application
```bash
cd web
npm run build
npm run preview
```

### Mobile Application
```bash
cd mobile
# For Android
npm run android

# For iOS
npm run ios
```

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

### How to Contribute

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

## 📋 Future Roadmap

### 📝 Kary (Tasks)
- **Smart Task Prioritization:** AI-powered task importance analysis based on habits and completion history
- **Automatic Task Breakdown:** AI suggestions for breaking complex tasks into manageable subtasks
- **Intelligent Scheduling:** Optimal task timing based on productivity patterns

### 🎯 Abhyasa (Habits)
- **Personalized Habit Coaching:** AI coach providing motivational insights and suggestions
- **Habit Prediction and Intervention:** Proactive support before habit streaks break
- **Advanced Analytics:** Deep insights into habit formation and maintenance

### 📔 Dainandini (Journal)
- **Sentiment Analysis:** Mood tracking and emotional state analysis
- **Automatic Summarization:** Key insights extraction from journal entries
- **Goal Integration:** Journal analysis for goal and habit suggestions

### 📚 Vidya (Knowledge)
- **Personalized Learning:** AI-powered resource recommendations
- **Knowledge Synthesis:** Smart Q&A based on saved content
- **Progress Tracking:** Learning goal monitoring and achievement

### 🏠 Home Dashboard
- **Dynamic Planning:** AI-generated personalized daily schedules
- **Life Insights:** Pattern recognition and productivity optimization
- **Predictive Analytics:** Future planning based on historical data

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by ancient Indian wisdom and modern productivity principles
- Special thanks to the open source community

## 📞 Support

If you have any questions or need support:

- 📧 Create an [issue](https://github.com/rag133/jeevan-saathi-master/issues)
- 💬 Join our discussions
- 📖 Check the [documentation](docs/)

---

<div align="center">
  <p>Made with ❤️ for a more organized and mindful life</p>
  <p><strong>Jeevan Saathi - Your Life Companion</strong></p>
</div>
