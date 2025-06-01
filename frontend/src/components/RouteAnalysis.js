"use client"

import { useState, useEffect } from "react"
import { formatDistance, formatTime } from "../utils/routeUtils"

// Ajout de la fonction pour obtenir l'icône de classement
const getRankIcon = (rank) => {
    switch(rank) {
        case 1: return "🥇";
        case 2: return "🥈";
        case 3: return "🥉";
        default: return rank;
    }
};

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
  safePathIndex,
}) => {
  const [activeTab, setActiveTab] = useState("current")
  const [currentRouteIndex, setCurrentRouteIndex] = useState(selectedRouteIndex)
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    if (route && riskData) {
      analyzeRoute(route, riskData)
    }
  }, [route, riskData])

  const analyzeRoute = (routeToAnalyze, riskDataToAnalyze) => {
    const geometry = routeToAnalyze.geometry || []
    const riskScore = riskDataToAnalyze.averageRiskScore || 0
    const riskStats = riskDataToAnalyze.riskStats || {}

    // 1. Analyse des zones à risque basée sur le score numérique
    const highRiskZones = riskStats["élevé"] || 0
    const mediumRiskZones = riskStats["moyen"] || 0
    const lowRiskZones = riskStats["faible"] || 0
    const totalRiskPoints = highRiskZones + mediumRiskZones + lowRiskZones

    // Nouvelle logique de classification basée sur le score numérique
    let riskLevel = "safe"
    let riskColor = "#6f42c1"
    let riskIcon = "🛡️"
    let riskLabel = "Sûr"

    if (riskScore >= 0.7) {
        riskLevel = "very-high"
        riskColor = "#dc3545"
        riskIcon = "🔴"
        riskLabel = "Très Élevé"
    } else if (riskScore >= 0.5) {
        riskLevel = "medium"
        riskColor = "#ffc107"
        riskIcon = "🟡"
        riskLabel = "Moyen"
    } else {
        riskLevel = "low"
        riskColor = "#28a745"
        riskIcon = "🟢"
        riskLabel = "Faible"
    }

    // 3. Générer des recommandations basées sur le score de risque
    const recommendations = []
    if (riskScore >= 0.7) {
        recommendations.push("🚨 ROUTE TRÈS DANGEREUSE - Cherchez une alternative")
        recommendations.push("⚠️ Si obligé de passer, réduisez drastiquement la vitesse")
        recommendations.push("📱 Prévenez votre dispatcher de votre itinéraire")
    } else if (riskScore >= 0.5) {
        recommendations.push("⚠️ Route moyennement risquée - Soyez vigilant")
        recommendations.push("🚛 Maintenez une distance de sécurité accrue")
        recommendations.push("🔍 Surveillez les zones à risque")
    } else {
        recommendations.push("✅ Route relativement sûre")
        recommendations.push("🚗 Conduite normale avec vigilance de base")
        recommendations.push("🛡️ Respectez le code de la route")
    }

    setAnalysis({
        riskScore,
        riskLevel,
        riskColor,
        riskIcon,
        riskLabel,
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
    setActiveTab("current")

    if (onRouteSelect) {
      onRouteSelect(routeIndex)
    }
  }

  const generateComparison = () => {
    if (!allRoutes || !allRiskData) return null

    return allRoutes
        .map((route, index) => {
            const riskData = allRiskData[index] || {}
            const riskScore = riskData.averageRiskScore || 0
            const riskStats = riskData.riskStats || {}
            
            const highRisk = riskStats["élevé"] || 0
            const mediumRisk = riskStats["moyen"] || 0
            const lowRisk = riskStats["faible"] || 0
            const totalRisk = highRisk + mediumRisk + lowRisk

            return {
                index: index + 1,
                routeIndex: index,
                distance: formatDistance(route.distance || 0),
                duration: formatTime(route.duration || 0),
                riskScore,
                highRisk,
                mediumRisk,
                lowRisk,
                totalRisk,
                isSelected: index === currentRouteIndex,
                isSafePath: index === safePathIndex,
                isValid: true,
            }
        })
        .sort((a, b) => a.riskScore - b.riskScore)
  }

  if (!isVisible || !analysis) return null

  const comparison = generateComparison()

  return (
    <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "90%",
        maxWidth: "600px",
        maxHeight: "80vh",
        backgroundColor: "#fff",
        borderRadius: "15px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
    }}>
        {/* Header */}
        <div style={{
            padding: "15px 20px",
            borderBottom: "1px solid #dee2e6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f8f9fa"
        }}>
            <h2 style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "600",
                color: "#2c3e50",
                display: "flex",
                alignItems: "center",
                gap: "8px"
            }}>
                <span>📊</span>
                Analyse de l'Itinéraire
            </h2>
            <button
                onClick={onClose}
                style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    padding: "5px",
                    color: "#6c757d",
                    transition: "color 0.2s",
                }}
                onMouseOver={(e) => e.target.style.color = "#dc3545"}
                onMouseOut={(e) => e.target.style.color = "#6c757d"}
            >
                ×
            </button>
        </div>

        {/* Tabs */}
        <div style={{ 
            display: "flex", 
            gap: "10px", 
            marginBottom: "20px",
            borderBottom: "1px solid #dee2e6"
        }}>
            <button
                onClick={() => setActiveTab("current")}
                style={{
                    padding: "10px 20px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: activeTab === "current" ? "#007bff" : "#6c757d",
                    borderBottom: activeTab === "current" ? "2px solid #007bff" : "none",
                    fontWeight: activeTab === "current" ? "bold" : "normal",
                    transition: "all 0.2s",
                }}
            >
                🎯 Route Actuelle
            </button>
            <button
                onClick={() => setActiveTab("compare")}
                style={{
                    padding: "10px 20px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: activeTab === "compare" ? "#007bff" : "#6c757d",
                    borderBottom: activeTab === "compare" ? "2px solid #007bff" : "none",
                    fontWeight: activeTab === "compare" ? "bold" : "normal",
                    transition: "all 0.2s",
                }}
            >
                📊 Comparer les Routes
            </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 5px", backgroundColor: "#fff" }}>
            {activeTab === "current" ? (
                <div style={{ padding: "0 15px" }}>
                    {/* Distance et Durée */}
                    <div style={{ 
                        display: "flex", 
                        gap: "20px", 
                        marginBottom: "20px" 
                    }}>
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ fontSize: "14px", color: "#6c757d" }}>Distance</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2c3e50" }}>
                                {formatDistance(analysis.distance)}
                            </div>
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ fontSize: "14px", color: "#6c757d" }}>Durée</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2c3e50" }}>
                                {formatTime(analysis.duration)}
                            </div>
                        </div>
                    </div>

                    {/* Score de Risque */}
                    <div style={{
                        backgroundColor: analysis.riskColor + "15",
                        padding: "15px",
                        borderRadius: "10px",
                        textAlign: "center",
                        border: `1px solid ${analysis.riskColor}`
                    }}>
                        <div style={{ fontSize: "24px", marginBottom: "5px" }}>{analysis.riskIcon}</div>
                        <div style={{ 
                            fontSize: "24px", 
                            fontWeight: "bold",
                            color: analysis.riskColor
                        }}>
                            {(analysis.riskScore * 100).toFixed(1)}%
                        </div>
                        <div style={{ color: analysis.riskColor }}>{analysis.riskLabel}</div>
                    </div>

                    {/* Analyse des Zones */}
                    <div style={{ 
                        backgroundColor: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "10px",
                        marginTop: "20px"
                    }}>
                        <h3 style={{ 
                            fontSize: "18px", 
                            marginBottom: "15px",
                            color: "#2c3e50"
                        }}>
                            🎯 Analyse des Zones
                        </h3>
                        <div style={{ 
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "10px",
                            marginBottom: "15px"
                        }}>
                            <div style={{
                                backgroundColor: "#dc354520",
                                padding: "15px",
                                borderRadius: "8px",
                                textAlign: "center"
                            }}>
                                <div style={{ color: "#dc3545", fontSize: "20px" }}>🔴</div>
                                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#dc3545" }}>
                                    {analysis.highRiskZones}
                                </div>
                                <div style={{ color: "#dc3545" }}>Zones à Risque Élevé</div>
                            </div>
                            <div style={{
                                backgroundColor: "#ffc10720",
                                padding: "15px",
                                borderRadius: "8px",
                                textAlign: "center"
                            }}>
                                <div style={{ color: "#ffc107", fontSize: "20px" }}>🟡</div>
                                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffc107" }}>
                                    {analysis.mediumRiskZones}
                                </div>
                                <div style={{ color: "#ffc107" }}>Zones à Risque Moyen</div>
                            </div>
                            <div style={{
                                backgroundColor: "#28a74520",
                                padding: "15px",
                                borderRadius: "8px",
                                textAlign: "center"
                            }}>
                                <div style={{ color: "#28a745", fontSize: "20px" }}>🟢</div>
                                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>
                                    {analysis.lowRiskZones}
                                </div>
                                <div style={{ color: "#28a745" }}>Zones à Faible Risque</div>
                            </div>
                        </div>
                        <div style={{ 
                            display: "flex",
                            justifyContent: "space-between",
                            backgroundColor: "#fff",
                            padding: "15px",
                            borderRadius: "8px"
                        }}>
                            <div>
                                <span style={{ fontWeight: "bold" }}>Total des zones:</span> {analysis.totalRiskPoints}
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div style={{ marginTop: "20px" }}>
                        <h3 style={{ 
                            fontSize: "18px", 
                            marginBottom: "15px",
                            color: "#2c3e50"
                        }}>
                            💡 Recommandations
                        </h3>
                        <div style={{ 
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px"
                        }}>
                            {analysis.recommendations.map((rec, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: "12px",
                                        backgroundColor: "#f8f9fa",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        color: "#495057"
                                    }}
                                >
                                    {rec}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: "0 15px" }}>
                    {/* Comparaison des Routes */}
                    <div style={{ 
                        display: "flex",
                        flexDirection: "column",
                        gap: "15px"
                    }}>
                        {comparison.map((route, idx) => (
                            <div
                                key={route.routeIndex}
                                onClick={() => handleRouteClickInComparison(route.routeIndex)}
                                style={{
                                    padding: "15px",
                                    backgroundColor: route.isSelected ? "#f8f9fa" : "#fff",
                                    border: `1px solid ${route.isSelected ? "#007bff" : "#dee2e6"}`,
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "15px",
                                }}
                            >
                                {/* Rank */}
                                <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    backgroundColor: route.isSafePath ? "#6f42c1" : idx < 3 ? "#f8d7da" : "#f8f9fa",
                                    color: route.isSafePath ? "#fff" : idx < 3 ? "#721c24" : "#2c3e50",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "18px",
                                    fontWeight: "bold"
                                }}>
                                    {getRankIcon(idx + 1)}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ 
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        marginBottom: "5px"
                                    }}>
                                        <span style={{ 
                                            fontWeight: "bold",
                                            color: "#2c3e50"
                                        }}>
                                            Route {route.index}
                                        </span>
                                        {route.isSafePath && (
                                            <span style={{
                                                backgroundColor: "#6f42c1",
                                                color: "white",
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                                fontSize: "12px"
                                            }}>
                                                SAFE PATH
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ 
                                        display: "flex",
                                        gap: "15px",
                                        color: "#6c757d",
                                        fontSize: "14px"
                                    }}>
                                        <span>🚗 {route.distance}</span>
                                        <span>⏱️ {route.duration}</span>
                                        <span>
                                            {route.highRisk > 0 && <span style={{ color: "#dc3545" }}>🔴 {route.highRisk}</span>}
                                            {route.mediumRisk > 0 && <span style={{ color: "#ffc107" }}> 🟡 {route.mediumRisk}</span>}
                                            {route.lowRisk > 0 && <span style={{ color: "#28a745" }}> 🟢 {route.lowRisk}</span>}
                                        </span>
                                    </div>
                                </div>

                                {/* Risk Score */}
                                <div style={{ textAlign: "right" }}>
                                    <div style={{
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        color: route.riskScore >= 0.7 ? "#dc3545" : 
                                               route.riskScore >= 0.5 ? "#ffc107" : "#28a745"
                                    }}>
                                        {(route.riskScore * 100).toFixed(1)}%
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                        Score de Risque
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}

export default RouteAnalysis