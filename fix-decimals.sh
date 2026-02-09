#!/bin/bash

echo "🔧 Correction des décimales: .toFixed(5) → .toFixed(2)"

# Liste des fichiers à corriger
files=(
  "src/pages/TradingDashboard/TradingDashboard.jsx"
  "src/components/TradingChart/TradingChart.jsx"
  "src/components/SignalProcess/SignalProcess.jsx"
  "src/components/TrailingStopPopup/TrailingStopPopup.jsx"
  "src/components/ScanOpportunity/ScanOpportunity.jsx"
  "src/services/signalEngine.js"
  "src/services/trailingStop.js"
  "src/services/positionManager.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
    sed -i 's/\.toFixed(5)/.toFixed(2)/g' "$file"
    sed -i 's/\.toFixed(3)/.toFixed(2)/g' "$file"
  fi
done

echo "✅ Correction terminée"
