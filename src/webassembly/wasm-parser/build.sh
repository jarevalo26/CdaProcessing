#!/bin/bash

echo "🦀 Compilando CDA Parser a WebAssembly..."

# Limpiar build anterior
rm -rf pkg/

# Compilar con wasm-pack
wasm-pack build --target web --out-dir pkg

# Verificar si la compilación fue exitosa
if [ $? -eq 0 ]; then
    echo "✅ Compilación exitosa!"
    echo "📦 Archivos generados en pkg/"
    ls -la pkg/
    
    # Copiar archivos a la carpeta js del proyecto
    echo "📋 Copiando archivos a ../js/"
    cp pkg/cda_parser_wasm.js ../js/
    cp pkg/cda_parser_wasm_bg.wasm ../js/

    # En caso de querer copiar todo
    # cp pkg/* ../js/

    echo "🎯 Archivos copiados correctamente"
    echo "📁 Verifica que ../js/ tenga:"
    ls -la ../js/cda_parser_wasm*
else
    echo "❌ Error en la compilación"
    exit 1
fi

echo "🎯 Para usar en tu proyecto, copia los archivos pkg/ a tu carpeta js/"