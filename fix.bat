@echo off
echo ========================================
echo Corrigindo Tailwind CSS...
echo ========================================

echo Removendo node_modules...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

echo Instalando dependencias...
call npm install

echo Instalando Tailwind CSS versao estavel...
call npm install -D tailwindcss@3 postcss@8 autoprefixer@10

echo Instalando outras dependencias...
call npm install lucide-react react-router-dom

echo Criando arquivos de configuracao...
echo export default { content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], theme: { extend: {} }, plugins: [] } > tailwind.config.js
echo export default { plugins: { tailwindcss: {}, autoprefixer: {} } } > postcss.config.js

echo ========================================
echo Corrigindo index.css...
echo ========================================

echo @tailwind base; > src\index.css
echo @tailwind components; >> src\index.css
echo @tailwind utilities; >> src\index.css

echo ========================================
echo Concluido!
echo Para rodar: npm run dev
echo ========================================
pause