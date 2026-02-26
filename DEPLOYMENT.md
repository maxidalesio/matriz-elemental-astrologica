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

### 4. ¡Listo! 🎉

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
- Verifica que la ubicación ingresada sea válida
- Intenta con una ciudad más específica (ej: "Buenos Aires, Argentina")

### No se guardan las personas:
- Las personas se guardan en el navegador (localStorage)
- Si borras las cookies/datos del navegador, se perderán

---

## 💰 Costos

- ✅ **Vercel:** 100% gratis
- ✅ **OpenStreetMap Nominatim:** 100% gratis (geocoding y sugerencias)
- ✅ **astronomy-engine:** Libre y de código abierto
- ✅ **Total:** $0 USD - ¡Sin API keys necesarias!

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

