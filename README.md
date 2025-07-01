# 🚀 QuizAI - The Future of Quizzing is Here!

![QuizAI Banner](https://placehold.co/1200/630.png)

Welcome to **QuizAI**, an interactive, real-time quiz application powered by the magic of generative AI. Create engaging quizzes on any topic imaginable in seconds, host live games for your friends or colleagues, and track your progress with a personalized profile.

Built with a modern, robust tech stack, QuizAI is designed to be fast, scalable, and fun!

## ✨ Features

-   🧠 **AI-Powered Quiz Generation:** Simply provide a topic, and our AI will generate a complete quiz with questions, multiple-choice options, and correct answers.
-   🎮 **Real-time Multiplayer Games:** Host a live quiz session and share a unique game PIN. Players can join from any device and compete on a live leaderboard.
-   🔐 **Secure User Authentication:** Multiple sign-in options including Email/Password, Google, and Phone (SMS). Your data and progress are saved to your account.
-   👤 **Personalized Profiles:** View your quiz history, track your total score, and see how many quizzes you've participated in.
-   📱 **Progressive Web App (PWA):** Install QuizAI on your desktop or mobile device for a seamless, native-app experience, complete with offline support and push notifications.
-   🎨 **Customizable Experience:** Choose between light and dark themes, or even set your own custom background image to make the app truly yours.

## 🛠️ Tech Stack

This project is built with a modern, production-ready stack:

-   **Framework:** [Next.js](https://nextjs.org/) (App Router)
-   **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, App Hosting)
-   **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit) (with Google's Gemini models)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [ShadCN/UI](https://ui.shadcn.com/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Testing:** [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 🚀 Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Firebase:**
    -   Create a new project in the [Firebase Console](https://console.firebase.google.com/).
    -   Go to **Project Settings** > **General** and copy your Firebase SDK setup object.
    -   Paste this configuration into `src/lib/firebase.ts`.
    -   In the Firebase Console, navigate to **Authentication** > **Sign-in method** and enable the **Email/Password**, **Google**, and **Phone** providers.
    -   Navigate to **Authentication** > **Settings** > **Authorized domains** and add `localhost` for local development.

4.  **Run the Development Servers:**
    You need to run two separate processes for the Next.js app and the Genkit AI flows.

    -   **Terminal 1 (Next.js App):**
        ```bash
        npm run dev
        ```
        Your app will be available at `http://localhost:9002`.

    -   **Terminal 2 (Genkit Flows):**
        ```bash
        npm run genkit:dev
        ```
        This starts the Genkit development UI, where you can inspect and test your AI flows.

## 📦 Deployment

This application is configured for easy deployment with **Firebase App Hosting**. Simply connect your GitHub repository to your Firebase project, and App Hosting will handle the build and deployment process automatically.

---

<p align="center">
  Made with ❤️ by Firebase Studio
</p>
