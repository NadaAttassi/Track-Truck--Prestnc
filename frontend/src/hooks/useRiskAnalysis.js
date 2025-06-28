"use client"

import { useState, useCallback } from "react"

const useRiskAnalysis = () => {
  const [riskAnalysis, setRiskAnalysis] = useState([]);
  const [safePathIndex, setSafePathIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Normaliser les données de risque pour assurer la cohérence
  const normalizeRiskData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => ({
      ...item,
      // S'assurer que averageRiskScore est défini (fallback sur riskScore pour la compatibilité)
      averageRiskScore: item.averageRiskScore !== undefined 
        ? item.averageRiskScore 
        : item.riskScore || 0,
      // S'assurer que riskStats est défini
      riskStats: item.riskStats || {
        élevé: 0,
        moyen: 0,
        faible: 0
      },
      // S'assurer que les autres champs sont définis
      detectedZones: item.detectedZones || [],
      detectedRisks: item.detectedRisks || []
    }));
  };

  // Fonction pour analyser les risques des itinéraires
  const analyzeRoutes = async (routes) => {
    if (!routes || routes.length === 0) {
      console.warn("Aucun itinéraire fourni pour l'analyse de risque");
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Préparer les données pour l'analyse de risque
      const routesForAnalysis = routes.map(route => ({
        coordinates: route.geometry,
        distance: route.distance,
        duration: route.duration
      }));

      console.log("Envoi de la requête d'analyse de risque pour", routesForAnalysis.length, "itinéraires");

      // 2. Appeler l'API d'analyse de risque
      const response = await fetch('http://localhost:5000/api/risk/analyze-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routes: routesForAnalysis,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur de réponse du serveur:", response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `Erreur HTTP ${response.status} lors de l'analyse des risques`);
      }

      const result = await response.json();
      console.log('Résultats bruts de l\'analyse de risque:', result);

      // 3. Normaliser les données reçues
      const normalizedAnalysis = normalizeRiskData(result.riskAnalysis || result);
      console.log('Données normalisées:', normalizedAnalysis);

      // 4. Mettre à jour l'état avec les données normalisées
      setRiskAnalysis(normalizedAnalysis);

      // 5. Trouver l'index de l'itinéraire le plus sûr (score de risque le plus bas)
      if (normalizedAnalysis.length > 0) {
        let minRiskScore = Infinity;
        let safestIndex = 0;

        normalizedAnalysis.forEach((analysis, index) => {
          console.log(`Itinéraire ${index}: score=${analysis.averageRiskScore}`);
          if (analysis.averageRiskScore < minRiskScore) {
            minRiskScore = analysis.averageRiskScore;
            safestIndex = index;
          }
        });

        console.log(`Itinéraire le plus sûr: ${safestIndex} avec un score de risque de ${minRiskScore}`);
        setSafePathIndex(safestIndex);
      }

      return normalizedAnalysis;
    } catch (err) {
      console.error('Erreur lors de l\'analyse des risques:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'analyse des risques');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour mettre à jour manuellement l'analyse de risque
  const updateRiskAnalysis = (newAnalysis) => {
    if (!newAnalysis) return;
    const normalized = Array.isArray(newAnalysis) 
      ? normalizeRiskData(newAnalysis) 
      : normalizeRiskData([newAnalysis]);
    setRiskAnalysis(normalized);
  };

  return {
    riskAnalysis,
    safePathIndex,
    isLoading,
    error,
    analyzeRoutes,
    updateRiskAnalysis,
    setRiskAnalysis: updateRiskAnalysis, // Utiliser la version normalisée
    setSafePathIndex,
  };
};

export default useRiskAnalysis
