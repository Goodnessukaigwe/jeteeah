# SERPHIDA - Modern Snake Game with Web3 Integration

A modern, Web3-powered Snake game built with Next.js, featuring classic gameplay mechanics enhanced with blockchain integration, token rewards, customizable skins, and achievement systems.

## 🚀 Features

### Classic Snake Gameplay

- **Traditional Mechanics**: Eat food to grow, score points, and avoid self-collision
- **Responsive Controls**: Arrow keys, or on-screen touch controls
- **Score Tracking**: Real-time score display with high score persistence

### Web3 Integration

- **Wallet Connection**: Connect via MetaMask, WalletConnect, Coinbase, or Guest Mode
- **Token System**: Earn tokens by playing and achieving milestones
- **Skin Customization**: Purchase and equip different snake skins with tokens
- **Achievement Rewards**: Unlock achievements for scoring milestones and earn token rewards

### User Interface

- **Modern Design**: Sleek dark theme with vibrant accents
- **Responsive Layout**: Optimized for mobile and desktop play
- **Intuitive Navigation**: Clean page transitions between game states
- **Visual Feedback**: Smooth animations and hover effects

## 🛠️ Tech Stack

- **Framework**: Next.js 16
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide React, React Icons
- **Development**: ESLint, PostCSS
- **State Management**: React Context API
- **Storage**: LocalStorage for high scores

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd jeteeah
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Play

1. **Start**: Begin from the landing page and navigate to the start screen
2. **Controls**:
   - **Arrow Keys** or **WASD**: Move the snake
   - **Touch Controls**: Use on-screen buttons for mobile play
   - **Pause Button**: Pause/resume gameplay
3. **Objective**: Eat the red food squares to grow and increase your score
4. **Scoring**: Each food item gives 5 points
5. **Game Over**: Avoid hitting yourself - game ends on self-collision
6. **Rewards**: Earn tokens based on your score and achievements

## 📁 Project Structure

```
snake/
├── app/                          # Next.js app directory
│   ├── contexts/                 # React contexts
│   │   └── GameContext.tsx       # Game state management
│   ├── game/                     # Game page
│   ├── gameover/                 # Game over page
│   ├── landing/                  # Landing page
│   ├── reward/                   # Rewards/achievements page
│   ├── skin/                     # Skin customization page
│   ├── start/                    # Game start page
│   ├── wallet/                   # Wallet connection page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # Reusable components
│   ├── ui/                       # UI components (buttons, cards)
│   ├── AchievementCard.tsx       # Achievement display
│   └── SkinCard.tsx              # Skin selection
├── lib/                          # Utility functions
├── public/                       # Static assets
│   └── images/                   # Game images
└── package.json                  # Dependencies and scripts
```

## 🎯 Game Features

- **Landing Page**: Welcome screen with game branding
- **Start Screen**: View high scores, tokens, and access game options
- **Game Screen**: Full-screen gameplay with controls and score display
- **Game Over Screen**: Results, replay options, and token rewards
- **Skin Shop**: Customize snake appearance with earned tokens
- **Rewards System**: Track achievements and earned tokens
- **Wallet Integration**: Connect Web3 wallets for enhanced features

## 🚀 Deployment

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically
