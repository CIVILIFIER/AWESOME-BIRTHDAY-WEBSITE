Interactive 3D Birthday Website

A cinematic, interactive birthday website built with **Next.js, React, TypeScript, Three.js, React Three Fiber, React Three Drei, GSAP, and Lenis**.

The project was designed as a personalized scrolling birthday experience with WebGL scenes, animations, interactive fireworks, a cake celebration, photos, wishes, and surprise sections.

> **Privacy:** Personal photos are intentionally NOT included in this repository. Anyone using this project should provide their own images locally.

---

# 🚀 Setup From Scratch

## 1. Requirements

Install:

* Node.js
* npm
* Git

Check your versions:

```bash
node -v
npm -v
git --version
```

---

## 2. Create the Next.js Project

Open Terminal and go to the location where you want the project.

Example:

```bash
cd ~/Desktop
```

Create the project:

```bash
npx create-next-app@latest uzma-birthday
```

During setup, use these options:

```text
What is your project named? → uzma-birthday

Would you like to use TypeScript? → Yes

Would you like to use ESLint? → Yes

Would you like to use Tailwind CSS? → No

Would you like your code inside a src/ directory? → No

Would you like to use App Router? → Yes

Would you like to customize the import alias? → No
```

Then enter the project:

```bash
cd uzma-birthday
```

---

# 📦 3. Install the Animation and 3D Modules

Install the packages used by this project:

```bash
npm install three @react-three/fiber @react-three/drei gsap lenis
```

### Packages used

| Package              | Purpose                     |
| -------------------- | --------------------------- |
| `three`              | 3D/WebGL rendering          |
| `@react-three/fiber` | React renderer for Three.js |
| `@react-three/drei`  | Useful Three.js/R3F helpers |
| `gsap`               | Advanced animations         |
| `lenis`              | Smooth scrolling            |

---

# 🗂️ 4. Project Structure

After setup, the important files should look like:

```text
uzma-birthday/
│
├── app/
│   ├── page.tsx
│   └── layout.tsx
│
├── public/
│   └── your-images-here
│
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── .gitignore
└── README.md
```

---

# 🧑‍💻 5. Main Website Code

The main website is inside:

```text
app/page.tsx
```

Replace the default Next.js `page.tsx` with the version from this repository.

---

# 🖼️ 6. Add Your Own Images

Personal images are intentionally excluded from this repository.

Create a `public` folder if needed:

```bash
mkdir -p public
```

Add your own images there.

Example:

```text
public/
├── uzma1.jpg
├── uzma2.jpg
├── uzma3.jpg
├── uzma4.jpg
├── uzma5.jpg
└── maki.jpg
```

The website expects these filenames.

### Important

Do **not** upload somebody else's private photos to a public repository without their permission.

For a reusable version of this project, replace the images with your own assets.

---

# ▶️ 7. Run the Website Locally

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

The site automatically updates while you edit `app/page.tsx`.

---

# 🏗️ 8. Create a Production Build

Build the website:

```bash
npm run build
```

Because this project uses a static Next.js export, the production files are generated inside:

```text
out/
```

---

# 🧪 9. Test the Production Build

Install/run a simple local static server:

```bash
npx serve out
```

Then open the address shown in Terminal.

Usually:

```text
http://localhost:3000
```

This lets you test the exported production version before deployment.

---

# ☁️ 10. Deploy to Cloudflare Pages

This project can be deployed using Cloudflare Pages.

Push the project to GitHub first.

Then create a Cloudflare Pages project from your GitHub repository.

Use:

```text
Framework preset:
Next.js (Static HTML Export)
```

Build command:

```text
npx next build
```

Build output directory:

```text
out
```

Production branch:

```text
main
```

---

# 🔐 11. GitHub Privacy

Do NOT commit personal photos.

The repository should contain the code and project configuration, but not private images.

Recommended `.gitignore` additions:

```gitignore
node_modules/
.next/
out/
.DS_Store

public/*.jpg
public/*.jpeg
public/*.png
public/*.webp
```

This prevents common image files from accidentally being committed.

---

# 📤 12. Create the Git Repository

Inside the project directory:

```bash
git init
```

Add the project files:

```bash
git add .
```

Create the first commit:

```bash
git commit -m "Initial interactive birthday website"
```

Create a repository on GitHub, then connect it:

```bash
git remote add origin YOUR_GITHUB_REPOSITORY_URL
```

Rename the branch:

```bash
git branch -M main
```

Push the project:

```bash
git push -u origin main
```

---

# 🎨 13. Customizing the Website

The main experience can be customized through:

```text
app/page.tsx
```

Common things to change include:

* Birthday person's name
* Birthday date
* Birthday messages
* Photos
* Colors
* Animations
* Fireworks
* Cake celebration
* Interactive sections
* Surprise content

---

# ✨ Current Interactive Features

The website includes:

* Cinematic birthday introduction
* Animated `UZMA` typography
* Scroll-controlled WebGL environment
* Floating background elements
* Pointer/touch interaction
* Interactive star sky
* Colorful touch fireworks
* Birthday cake assembly
* Candle lighting sequence
* Fireworks celebration
* Falling balloons
* Animated photo memories
* Interactive wishes
* Personalized letter reveal
* Surprise image/character section
* Mobile rendering optimizations

---

# 📱 Mobile Support

The website is designed to work on both desktop and mobile browsers.

Some WebGL rendering settings are reduced on mobile to improve performance while preserving the main visual experience.

For the best experience, use a modern browser with WebGL support.

---

# 🛠️ Useful Commands

Start development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Run production export locally:

```bash
npx serve out
```

Install dependencies:

```bash
npm install
```

Check Git status:

```bash
git status
```

Commit changes:

```bash
git add .
git commit -m "Update birthday experience"
```

Push changes:

```bash
git push
```

---

# 🧹 If Something Goes Wrong

Try reinstalling dependencies:

```bash
rm -rf node_modules
rm -rf .next
npm install
```

Then:

```bash
npm run dev
```

For a fresh production build:

```bash
rm -rf out
npm run build
```

---

# 📁 Final Project Structure

```text
uzma-birthday/
│
├── app/
│   ├── page.tsx
│   └── layout.tsx
│
├── public/
│   └── personal-images/
│
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── .gitignore
└── README.md
```

---

# ❤️ Credits

Created as a personalized interactive birthday web experience.

Built with:

**Next.js + React + TypeScript + Three.js + React Three Fiber + Drei + GSAP + Lenis**

Made with code, animation, and an unreasonable amount of attention to tiny details.

---

# 📄 License

You may modify this project for personal and educational use.

Please respect the privacy and copyright of any images, characters, music, or other media you add.
