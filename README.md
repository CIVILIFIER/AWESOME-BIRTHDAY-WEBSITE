# BIRTHDAY-WISH-1
A cinematic, interactive 3D birthday website built with Next.js, React Three Fiber, Three.js, GSAP and Lenis. Designed as a personalized birthday experience with animated scenes, interactive fireworks, a cake celebration, photos, wishes, and surprise reveals.
Birthday — Interactive 3D Birthday Experience

A cinematic, interactive birthday website created as a personalized digital experience.

Built with Next.js, React, Three.js, React Three Fiber, GSAP, and Lenis.

The goal is to make a birthday website feel less like a normal webpage and more like a small interactive world.

✨ Features
Cinematic animated opening
Interactive 3D background
Floating animated elements
Scroll-based camera movement
Interactive touch/click fireworks
Birthday cake assembly and candle-lighting celebration
Falling balloons during the cake celebration
Animated birthday photos
Interactive "Make a Wish" experience
Personalized letter reveal
Surprise character/image reveal
Responsive mobile experience
Lightweight WebGL optimizations for mobile devices
🛠️ Tech Stack
Next.js
React
TypeScript
Three.js
React Three Fiber
React Three Drei
GSAP
Lenis
CSS animations
🚀 Getting Started
1. Clone the repository
git clone YOUR_REPOSITORY_URL
cd uzma-birthday
2. Install dependencies
npm install
3. Start the development server
npm run dev

Open:

http://localhost:3000
📦 Production Build

This project is configured for static export.

Run:

npm run build

The production website will be generated inside:

out/

To test the exported version locally:

npx serve out
🖼️ Images

Place website images inside the public directory.

Example:

public/
├── uzma1.jpg
├── uzma2.jpg
├── uzma3.jpg
├── uzma4.jpg
├── uzma5.jpg
└── maki.jpg

Images can then be referenced in the website using paths such as:

<img src="/maki.jpg" alt="Maki" />
⚙️ Project Structure
uzma-birthday/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── public/
│   └── images...
│
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
└── README.md
☁️ Deployment

The project can be deployed through platforms that support static Next.js exports, including Cloudflare Pages.

For a static export, use:

Build command

npx next build

Build output directory

out

Production branch

main
💡 Customizing the Experience

You can replace the images, messages, animations, colors, and interactive sections to create a completely different birthday experience.

The main page is located at:

app/page.tsx

Images and other static assets should normally be placed in:

public/
📱 Mobile

The experience includes mobile-specific rendering optimizations to reduce WebGL load while preserving the major visual and interactive effects.

For the best experience, use a modern browser with WebGL support.

❤️ Credits

Created as a personalized interactive birthday experience.

Made with code, animation, and a lot of unnecessary attention to tiny details.

License

You are free to modify this project for your own personal use.
