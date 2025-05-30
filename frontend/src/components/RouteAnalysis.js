"use client"

import { useState, useEffect } from "react"
import { formatDistance, formatTime } from "../utils/routeUtils"

const RouteAnalysis = ({
  route,
  riskData,
  zones,
  isVisible,
  onClose,
  allRoutes,
  allRiskData,
  selectedRouteIndex,
  onRouteSelect,
  safePathIndex, // Ajouté pour identifier la route "SAFE"
}) => {
  const [analysis, setAnalysis] = useState(null)
  const [showComparison, setShowComparison] = useState(false)
  const [currentRouteIndex, setCurrentRouteIndex] = useState(selectedRouteIndex)

  useEffect(() => {
    setCurrentRouteIndex(selectedRouteIndex)
  }, [selectedRouteIndex])

  useEffect(() => {
    const currentRoute = allRoutes?.[currentRouteIndex] || route
    const currentRiskData = allRiskData?.[currentRouteIndex] || riskData

    if (currentRoute && currentRiskData && zones) {
      analyzeRoute(currentRoute, currentRiskData)
    }
  }, [currentRouteIndex, allRoutes, allRiskData, route, riskData, zones])

  const analyzeRoute = (routeToAnalyze, riskDataToAnalyze) => {
    const geometry = routeToAnalyze.geometry || []
    const riskCounts = riskDataToAnalyze.riskCounts || {}

    // 1. Analyse des zones à risque
    const highRiskZones = riskCounts["élevé"] || 0
    const mediumRiskZones = riskCounts["moyen"] || 0
    const lowRiskZones = riskCounts["faible"] || 0
    const totalRiskPoints = highRiskZones + mediumRiskZones + lowRiskZones

    // 🔥 NOUVELLE LOGIQUE DE CLASSIFICATION PAR POURCENTAGE
    let riskLevel = "safe"
    let riskColor = "#6f42c1"
    let riskIcon = "🛡️"
    let riskLabel = "Sûr"
    let riskPercentage = 0

    if (totalRiskPoints > 0) {
      // Calculer le pourcentage de zones à risque élevé
      riskPercentage = Math.round((highRiskZones / totalRiskPoints) * 100)

      if (riskPercentage >= 50) {
        // 🔴 TRÈS ÉLEVÉ - Plus de la moitié des zones sont dangereuses
        riskLevel = "very-high"
        riskColor = "#dc3545"
        riskIcon = "🔴"
        riskLabel = "Très Élevé"
      } else if (riskPercentage >= 25) {
        // 🟠 ÉLEVÉ - 1/4 des zones sont dangereuses
        riskLevel = "high"
        riskColor = "#fd7e14"
        riskIcon = "🟠"
        riskLabel = "Élevé"
      } else if (riskPercentage >= 10) {
        // 🟡 MOYEN-ÉLEVÉ - 10% de zones dangereuses = attention
        riskLevel = "medium-high"
        riskColor = "#ffc107"
        riskIcon = "🟡"
        riskLabel = "Moyen-Élevé"
      } else if (riskPercentage > 0) {
        // 🔵 FAIBLE-MOYEN - Quelques zones dangereuses isolées
        riskLevel = "low-medium"
        riskColor = "#17a2b8"
        riskIcon = "🔵"
        riskLabel = "Faible-Moyen"
      } else {
        // 🟢 FAIBLE - Aucune zone à risque élevé
        riskLevel = "low"
        riskColor = "#28a745"
        riskIcon = "🟢"
        riskLabel = "Faible"
      }
    }

    // 2. Calcul du score de sécurité (0-100) - BASÉ SUR LE POURCENTAGE
    let safetyScore = 100
    if (totalRiskPoints > 0) {
      // Score basé sur le pourcentage de zones à risque élevé
      safetyScore = Math.max(0, 100 - riskPercentage)
    }

    // 3. Générer des recommandations basées sur le pourcentage
    const recommendations = []
    if (riskPercentage >= 50) {
      recommendations.push("🚨 ROUTE TRÈS DANGEREUSE - Cherchez une alternative")
      recommendations.push("⚠️ Si obligé de passer, réduisez drastiquement la vitesse")
      recommendations.push("📱 Prévenez votre dispatcher de votre itinéraire")
    } else if (riskPercentage >= 25) {
      recommendations.push("⚠️ Route risquée - Soyez très vigilant")
      recommendations.push("🚛 Maintenez une distance de sécurité accrue")
      recommendations.push("📱 Restez en contact avec votre base")
    } else if (riskPercentage >= 10) {
      recommendations.push("⚡ Vigilance requise dans certaines zones")
      recommendations.push("🔍 Surveillez les panneaux de signalisation")
      recommendations.push("🚛 Respectez les limitations de vitesse")
    } else if (riskPercentage > 0) {
      recommendations.push("✅ Route globalement sûre")
      recommendations.push("🎯 Attention ponctuelle dans quelques zones")
      recommendations.push("🚗 Conduite normale avec vigilance")
    } else {
      recommendations.push("🛡️ Route très sûre, aucun risque élevé détecté")
      recommendations.push("🚗 Conduite normale recommandée")
      recommendations.push("✅ Respectez le code de la route")
    }

    setAnalysis({
      safetyScore,
      riskLevel,
      riskColor,
      riskIcon,
      riskLabel,
      riskPercentage,
      highRiskZones,
      mediumRiskZones,
      lowRiskZones,
      totalRiskPoints,
      recommendations,
      distance: routeToAnalyze.distance || 0,
      duration: routeToAnalyze.duration || 0,
      isValid: true,
    })
  }

  const handleRouteClickInComparison = (routeIndex) => {
    console.log(`🔄 Clic sur route ${routeIndex + 1} dans la comparaison`)
    setCurrentRouteIndex(routeIndex)
    setShowComparison(false)

    if (onRouteSelect) {
      onRouteSelect(routeIndex)
    }
  }

  const generateComparison = () => {
    if (!allRoutes || !allRiskData) return null

    return allRoutes
      .map((route, index) => {
        const riskData = allRiskData[index] || { riskCounts: {} }
        const riskCounts = riskData.riskCounts
        const highRisk = riskCounts["élevé"] || 0
        const mediumRisk = riskCounts["moyen"] || 0
        const lowRisk = riskCounts["faible"] || 0
        const totalRisk = highRisk + mediumRisk + lowRisk

        // Calcul du safetyScore et riskPercentage
        let safetyScore = 100
        let riskPercentage = 0

        if (totalRisk > 0) {
          riskPercentage = Math.round((highRisk / totalRisk) * 100)
          safetyScore = Math.max(0, 100 - riskPercentage)
        }

        return {
          index: index + 1,
          routeIndex: index,
          distance: formatDistance(route.distance || 0),
          duration: formatTime(route.duration || 0),
          safetyScore,
          riskPercentage,
          highRisk,
          mediumRisk,
          lowRisk,
          totalRisk,
          isSelected: index === currentRouteIndex,
          isValid: true,
        }
      })
      .sort((a, b) => b.safetyScore - a.safetyScore)
  }

  if (!isVisible || !analysis) return null

  const comparison = generateComparison()
  const contentHeight = "70vh"

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "90%",
        maxWidth: "700px",
        backgroundColor: "white",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        zIndex: 2000,
        overflow: "hidden",
        maxHeight: "90vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "20px",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "50%",
            width: "30px",
            height: "30px",
            color: "white",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          ×
        </button>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "20px" }}>
          {showComparison ? "📊 Comparaison des Routes" : `📊 Analyse Route ${currentRouteIndex + 1}`}
        </h2>
        <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>
          {showComparison
            ? `${allRoutes?.length || 0} routes analysées`
            : `${formatDistance(analysis.distance)} • ${formatTime(analysis.duration)}`}
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: "20px", overflowY: "auto", height: contentHeight }}>
        {/* Toggle buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => setShowComparison(false)}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: !showComparison ? "#6f42c1" : "#e9ecef",
              color: !showComparison ? "white" : "#333",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Route Actuelle
          </button>
          <button
            onClick={() => setShowComparison(true)}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: showComparison ? "#6f42c1" : "#e9ecef",
              color: showComparison ? "white" : "#333",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Comparer Toutes
          </button>
        </div>

        {showComparison ? (
          /* Comparaison des routes */
          <div>
            <div style={{ marginBottom: "15px" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>🏆 Classement par sécurité</h4>
              <p style={{ fontSize: "13px", color: "#666", margin: "0 0 15px 0" }}>
                Score de 0 à 100 (100 = parfaitement sûr). Pourcentage = % de zones à risque élevé.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {comparison?.map((route, index) => (
                <div
                  key={route.index}
                  style={{
                    padding: "15px",
                    backgroundColor: route.isSelected
                      ? "#e3f2fd"
                      : safePathIndex === route.routeIndex
                      ? "#f0fff4" // Surlignage vert pour la route "SAFE"
                      : "#f8f9fa",
                    border: route.isSelected
                      ? "2px solid #2196f3"
                      : safePathIndex === route.routeIndex
                      ? "2px solid #28a745"
                      : "1px solid #dee2e6",
                    borderRadius: "8px",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto auto",
                    gap: "15px",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => handleRouteClickInComparison(route.routeIndex)}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: index === 0 ? "#ffd700" : "#666" }}>
                      #{index + 1}
                    </div>
                    {index === 0 && <div style={{ fontSize: "12px", color: "#ffd700" }}>🏆 BEST</div>}
                    {safePathIndex === route.routeIndex && (
                      <div style={{ fontSize: "12px", color: "#28a745" }}>🛡️ SAFE</div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                      Route {route.index}
                      {route.isSelected && <span style={{ color: "#2196f3", marginLeft: "5px" }}>(Analysée)</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {route.distance} • {route.duration}
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: route.safetyScore > 80 ? "#28a745" : route.safetyScore > 50 ? "#ffc107" : "#dc3545",
                      }}
                    >
                      {route.safetyScore}
                    </div>
                    <div style={{ fontSize: "10px", color: "#666" }}>Score</div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color:
                          route.riskPercentage > 25 ? "#dc3545" : route.riskPercentage > 10 ? "#ffc107" : "#28a745",
                      }}
                    >
                      {route.riskPercentage}%
                    </div>
                    <div style={{ fontSize: "10px", color: "#666" }}>Risque Élevé</div>
                  </div>

                  <div style={{ display: "flex", gap: "5px" }}>
                    {route.highRisk > 0 && (
                      <span
                        style={{
                          backgroundColor: "#dc3545",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                        }}
                      >
                        {route.highRisk}H
                      </span>
                    )}
                    {route.mediumRisk > 0 && (
                      <span
                        style={{
                          backgroundColor: "#ffc107",
                          color: "#333",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                        }}
                      >
                        {route.mediumRisk}M
                      </span>
                    )}
                    {route.lowRisk > 0 && (
                      <span
                        style={{
                          backgroundColor: "#28a745",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                        }}
                      >
                        {route.lowRisk}L
                      </span>
                    )}
                    {route.totalRisk === 0 && (
                      <span
                        style={{
                          backgroundColor: "#6f42c1",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                        }}
                      >
                        SAFE
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Analyse de la route actuelle */
          <div>
            {/* Score de sécurité avec pourcentage */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                border: `3px solid ${analysis.riskColor}`,
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: analysis.riskColor,
                  marginBottom: "5px",
                }}
              >
                {analysis.safetyScore}
              </div>
              <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "10px" }}>Score de Sécurité (0-100)</div>

              {analysis.riskPercentage > 0 && (
                <div style={{ fontSize: "16px", color: analysis.riskColor, marginBottom: "10px", fontWeight: "bold" }}>
                  {analysis.riskPercentage}% de zones à risque élevé
                </div>
              )}

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: analysis.riskColor,
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                <span>{analysis.riskIcon}</span>
                <span>Risque {analysis.riskLabel}</span>
              </div>
            </div>

            {/* Statistiques détaillées */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#fff5f5",
                  borderRadius: "8px",
                  border: "1px solid #fed7d7",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#dc3545" }}>{analysis.highRiskZones}</div>
                <div style={{ fontSize: "12px", color: "#6c757d" }}>Zones à Risque Élevé</div>
              </div>

              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#fffbf0",
                  borderRadius: "8px",
                  border: "1px solid #fbd38d",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f56500" }}>{analysis.mediumRiskZones}</div>
                <div style={{ fontSize: "12px", color: "#6c757d" }}>Zones à Risque Moyen</div>
              </div>

              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#f0fff4",
                  borderRadius: "8px",
                  border: "1px solid #9ae6b4",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>{analysis.lowRiskZones}</div>
                <div style={{ fontSize: "12px", color: "#6c757d" }}>Zones à Faible Risque</div>
              </div>
            </div>

            {/* Recommandations */}
            {analysis.recommendations.length > 0 && (
              <div
                style={{
                  backgroundColor: "#e6f3ff",
                  border: "1px solid #b3d9ff",
                  borderRadius: "8px",
                  padding: "15px",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", color: "#0066cc", fontSize: "14px" }}>💡 Recommandations</h4>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {analysis.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      style={{
                        fontSize: "13px",
                        color: "#333",
                        marginBottom: "5px",
                        lineHeight: "1.4",
                      }}
                    >
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RouteAnalysis