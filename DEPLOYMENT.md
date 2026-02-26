# 🚀 Guía de Deployment en Vercel

Tu proyecto ya está configurado para desplegarse en Vercel. Sigue estos pasos:

## 📋 Pasos para Deploy

### 1. Crear cuenta en Vercel (30 segundos)

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Selecciona **"Continue with GitHub"**
4. Autoriza a Vercel para acceder a tus repositorios

---

### 2. Subir tu proyecto a GitHub

Si aún no lo has hecho:

```bash
cd /Users/mdalesio/Documents/matriz-elemental-astrologica
git init
git add .
git commit -m "Initial commit - ready for Vercel"
git branch -M main
git remote add origin <tu-repo-de-github>
git push -u origin main
```

---

### 3. Importar proyecto en Vercel

1. En el dashboard de Vercel, haz clic en **"Add New Project"**
2. Selecciona tu repositorio de GitHub
3. Vercel detectará automáticamente que es un proyecto **Vite**
4. **NO CAMBIES NADA** en la configuración (ya está todo listo)
5. Haz clic en **"Deploy"**

---

### 4. Configurar la API Key de Gemini

**IMPORTANTE:** Tu app necesita esta variable de entorno para funcionar.

1. Obtén tu API Key de Gemini:
   - Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Haz clic en **"Create API Key"**
   - Copia la key

2. En Vercel:
   - Ve a tu proyecto → **"Settings"** → **"Environment Variables"**
   - Agrega una nueva variable:
     - **Name:** `GEMINI_API_KEY`
     - **Value:** `tu_api_key_aqui`
   - Haz clic en **"Save"**

3. **Re-deploya el proyecto:**
   - Ve a **"Deployments"**
   - Haz clic en los 3 puntos del último deployment
   - Selecciona **"Redeploy"**

---

### 5. ¡Listo! 🎉

Tu app estará disponible en: `https://tu-proyecto.vercel.app`

Cada vez que hagas `git push` a GitHub, Vercel desplegará automáticamente los cambios.

---

## 🔍 Verificar que funciona

1. Abre tu app en el navegador
2. Ingresa datos de nacimiento
3. Haz clic en **"Generar Carta Natal"**
4. Si ves los resultados, ¡funciona perfectamente! ✅

---

## 🆘 Solución de problemas

### La app no carga:
- Verifica que el build haya terminado correctamente en Vercel
- Revisa los logs en Vercel → Deployments → View Function Logs

### "Failed to calculate chart":
- Verifica que hayas configurado `GEMINI_API_KEY` correctamente
- Asegúrate de haber re-desplegado después de agregar la variable

### No se guardan las personas:
- Las personas se guardan en el navegador (localStorage)
- Si borras las cookies/datos del navegador, se perderán

---

## 💰 Costos

- ✅ **Vercel:** 100% gratis
- ✅ **Gemini API:** Gratis hasta 1,500 requests/día
- ✅ **Total:** $0 USD

---

## 🔄 Actualizar tu app

```bash
# Haz cambios en tu código
git add .
git commit -m "Descripción de cambios"
git push

# Vercel desplegará automáticamente en ~30 segundos
```

---

¿Necesitas ayuda? Revisa los logs en Vercel o verifica la consola del navegador (F12).

