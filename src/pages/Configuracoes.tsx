import { useState, useEffect } from "react"
import { Trash2, Save } from "lucide-react"

export default function Configuracoes() {
  const [, setLogoUrl] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    const savedLogo = sessionStorage.getItem("logo_url")
    if (savedLogo) {
      setLogoUrl(savedLogo)
      setPreview(savedLogo)
    }
  }, [])

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setPreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const salvarLogo = () => {
    if (preview) {
      setLogoUrl(preview)
      sessionStorage.setItem("logo_url", preview)
      alert("Logo salva com sucesso!")
      window.location.reload()
    }
  }

  const removerLogo = () => {
    setPreview(null)
    setLogoUrl(null)
    sessionStorage.removeItem("logo_url")
    alert("Logo removida!")
    window.location.reload()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Personalize a aparência do sistema</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo do Sistema</h2>
        
        <div className="flex flex-col items-center gap-6">
          {/* Preview da logo */}
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            {preview ? (
              <img src={preview} alt="Preview da logo" className="w-32 h-32 object-contain mx-auto mb-3" />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-4xl text-white">🔧</span>
              </div>
            )}
            <p className="text-sm text-gray-500">Prévia da sua logo</p>
          </div>

          {/* Upload */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escolher imagem
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Formatos aceitos: PNG, JPG, SVG. Tamanho recomendado: 200x200px
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 w-full">
            <button
              onClick={salvarLogo}
              disabled={!preview}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Salvar Logo
            </button>
            <button
              onClick={removerLogo}
              className="flex-1 border border-red-500 text-red-600 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-50 transition"
            >
              <Trash2 className="w-4 h-4" />
              Remover Logo
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>📌 <strong>Dica:</strong> A logo aparece no menu lateral do sistema.</p>
          <p>📌 A logo é salva no seu navegador e persistirá entre sessões.</p>
          <p>📌 Para uma melhor experiência, use imagens com fundo transparente (PNG).</p>
        </div>
      </div>
    </div>
  )
}
