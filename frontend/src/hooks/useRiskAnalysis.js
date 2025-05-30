"use client"

import { useState, useCallback } from "react"

const useRiskAnalysis = () => {
  const [riskAnalysis, setRiskAnalysis] = useState([])
  const [safePathIndex, setSafePathIndex] = useState(null)

  const fetchRiskAnalysis = useCallback(
    async (
      routesToAnalyze,
      zonesToAnalyze,
      setError,
      setSelectedRouteIndex,
      setRouteGeometry,
      setRouteInstructions,
      setRemainingDistance,
      setRemainingTime,
      setShowInstructions,
    ) => {
      try {
        console.log("Analyse des risques déléguée au backend...")

        // ✅ La logique de calcul est maintenant dans useRoute.js
        // Ce hook devient plus simple et se contente de gérer l'état
      } catch (err) {
        console.error("Erreur fetchRiskAnalysis:", err)
        setRiskAnalysis([])
        setSafePathIndex(null)
        setError("Erreur lors de l'analyse des risques : " + err.message)
      }
    },
    [],
  )

  return { riskAnalysis, setRiskAnalysis, safePathIndex, setSafePathIndex, fetchRiskAnalysis }
}

export default useRiskAnalysis
