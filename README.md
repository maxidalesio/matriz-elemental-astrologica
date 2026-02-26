# ⚡ Matriz Elemental Astrológica

Aplicación web para calcular automáticamente cartas natales y analizar la distribución de elementos y modalidades astrológicas usando IA (Gemini) y cálculos astronómicos precisos.

## ✨ Características

- 🌟 **Cálculo automático de cartas natales** con Gemini AI
- 🪐 **Posiciones planetarias precisas** usando astronomy-engine
- 📊 **Análisis de elementos** (Fuego, Tierra, Aire, Agua)
- 🔄 **Análisis de modalidades** (Cardinal, Fijo, Mutable)
- 💾 **Guardado de personas** en localStorage
- 🎨 **UI moderna y animada** con Tailwind CSS y Motion
- 📱 **Responsive design**

## 🚀 Desarrollo Local

**Prerequisitos:** Node.js 18+

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar API Key:**
   - Crea un archivo `.env.local` en la raíz
   - Agrega tu key de Gemini:
     ```
     GEMINI_API_KEY=tu_api_key_aqui
     ```
   - Obtén una key gratis en: https://aistudio.google.com/app/apikey

3. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

4. Abre http://localhost:5173

## 📦 Deploy en Vercel

**Ver guía completa:** [DEPLOYMENT.md](DEPLOYMENT.md)

Resumen:
1. Sube el proyecto a GitHub
2. Importa en Vercel (detecta Vite automáticamente)
3. Agrega `GEMINI_API_KEY` en Environment Variables
4. Deploy ✅ (100% gratis)

## 🛠️ Stack Tecnológico

- **Frontend:** React 19, TypeScript, Vite
- **Estilos:** Tailwind CSS 4
- **Animaciones:** Motion (Framer Motion)
- **Charts:** Recharts
- **IA:** Google Gemini API
- **Astronomía:** astronomy-engine
- **Deployment:** Vercel (Serverless Functions)
- **Storage:** localStorage

## 📄 Licencia

MIT
