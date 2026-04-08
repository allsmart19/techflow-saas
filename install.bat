@echo off
echo ========================================
echo Instalando dependencias do projeto...
echo ========================================

echo Removendo node_modules...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

echo Instalando dependencias...
call npm install

echo Instalando Tailwind CSS...
call npm install -D tailwindcss postcss autoprefixer

echo Criando arquivos de configuracao...
echo export default { content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], theme: { extend: {} }, plugins: [] } > tailwind.config.js
echo export default { plugins: { tailwindcss: {}, autoprefixer: {} } } > postcss.config.js

echo Instalando bibliotecas adicionais...
call npm install lucide-react react-router-dom

echo ========================================
echo Instalacao concluida!
echo Para rodar o projeto: npm run dev
echo ========================================
pause