"use client"

import { formatDistance, formatTime } from "../utils/routeUtils"

const RouteInfo = ({
  showRouteInfo,
  routes,
  remainingDistance,
  remainingTime,
  expandedCard,
  toggleCard,
  riskAnalysis,
  selectedRouteIndex,
  safePathIndex,
  error,
  setSelectedRouteIndex,
  setRouteGeometry,
  setRouteInstructions,
  setRemainingDistance,
  setRemainingTime,
  setShowInstructions,
  showInstructions,
  routeInstructions,
  onShowAnalysis,
}) => {
  if (!showRouteInfo || !routes || routes.length === 0) {
    return null
  }

  const getRouteButtonStyle = (index, riskCounts) => {
    if (!riskCounts) {
      console.log(`⚠️ Route ${index + 1}: Aucun riskCounts disponible`)
      return {
        backgroundColor: "#6c757d",
        color: "white",
        border: "1px solid #6c757d",
      }
    }

    const highRisk = riskCounts["élevé"] || 0
    const mediumRisk = riskCounts["moyen"] || 0
    const lowRisk = riskCounts["faible"] || 0
    const totalRisk = highRisk + mediumRisk + lowRisk

    // Calculer le safetyScore comme dans RouteAnalysis
    let safetyScore = 100
    if (totalRisk > 0) {
      const riskPercentage = Math.round((highRisk / totalRisk) * 100)
      safetyScore = Math.max(0, 100 - riskPercentage)
    }

    console.log(
      `🔍 Route ${index + 1}: highRisk=${highRisk}, mediumRisk=${mediumRisk}, lowRisk=${lowRisk}, totalRisk=${totalRisk}, safetyScore=${safetyScore}, safePathIndex=${safePathIndex}, index=${index}`,
    )

    // Vérifier si la route est "SAFE" uniquement si elle est safePathIndex
    const isSafe = safePathIndex === index
    console.log(`🛡️ Route ${index + 1}: isSafe=${isSafe} (safePathIndex === index: ${safePathIndex === index})`)

    if (isSafe) {
      return {
        backgroundColor: "#6f42c1", // Couleur mauve pour la route "SAFE"
        color: "white",
        border: "2px solid #6f42c1",
      }
    }

    if (totalRisk === 0) {
      return {
        backgroundColor: "#6c757d",
        color: "white",
        border: "1px solid #6c757d",
      }
    }

    const maxKnownRisk = Math.max(highRisk, mediumRisk, lowRisk)

    if (highRisk === maxKnownRisk && highRisk > 0) {
      return {
        backgroundColor: "#dc3545",
        color: "white",
        border: "2px solid #dc3545",
      }
    } else if (mediumRisk === maxKnownRisk && mediumRisk > 0) {
      return {
        backgroundColor: "#ffc107",
        color: "black",
        border: "2px solid #ffc107",
      }
    } else {
      return {
        backgroundColor: "#28a745",
        color: "white",
        border: "2px solid #28a745",
      }
    }
  }

  const handleRouteSelection = (index) => {
    console.log(`🔄 Sélection route ${index + 1} (sans ouvrir l'analyse)`)
    setSelectedRouteIndex(index)
    const selectedRoute = routes[index]
    setRouteGeometry(selectedRoute.geometry)
    setRouteInstructions(selectedRoute.instructions)
    setRemainingDistance(selectedRoute.distance)
    setRemainingTime(selectedRoute.duration)
    setShowInstructions(false)
  }

  const currentRiskData =
    riskAnalysis && riskAnalysis.length > 0 && riskAnalysis[selectedRouteIndex]
      ? riskAnalysis[selectedRouteIndex]
      : null

  console.log(`📊 Données actuelles: selectedRouteIndex=${selectedRouteIndex}, safePathIndex=${safePathIndex}, currentRiskData=${JSON.stringify(currentRiskData)}`)

  const isExpanded = expandedCard === "route"

  const currentInstructions = routes[selectedRouteIndex]?.instructions || routeInstructions || []

  return (
    <div
      style={{
        position: "fixed",
        top: "200px",
        right: "0",
        width: isExpanded ? "350px" : "40px",
        height: "auto",
        maxHeight: "400px",
        background: "#fff",
        borderRadius: "10px 0 0 10px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: 998,
        display: "flex",
        transition: "width 0.3s ease",
        overflow: "hidden",
      }}
    >
      {/* Header vertical */}
      <div
        onClick={() => toggleCard("route")}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "40px",
          height: "100%",
          background: "linear-gradient(180deg, #0056b3, #dc3545)",
          borderRadius: "10px 0 0 10px",
          cursor: "pointer",
          fontWeight: "500",
          fontSize: "14px",
          color: "#fff",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          padding: "10px 5px",
          transition: "background-color 0.2s",
        }}
      >
        <span>Itinéraires</span>
        <span style={{ fontSize: "12px", color: "#f0f0f0", marginTop: "5px" }}>{isExpanded ? "◄" : "►"}</span>
      </div>

      {/* Contenu */}
      {isExpanded && (
        <div style={{ padding: "15px", flex: 1, overflowY: "auto" }}>
          {/* 1. INFOS */}
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
              border: "1px solid #dee2e6",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>📍</span>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "16px", color: "#0056b3" }}>
                    {formatDistance(remainingDistance)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6c757d" }}>Distance</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>⏱️</span>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "16px", color: "#0056b3" }}>
                    {formatTime(remainingTime)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6c757d" }}>Temps</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. ROUTES */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold" }}>
              Choisir un itinéraire ({routes.length}):
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px",
                maxHeight: "120px",
                overflowY: "auto",
              }}
            >
              {routes.map((route, index) => {
                const riskCounts = riskAnalysis && riskAnalysis[index] ? riskAnalysis[index].riskCounts : null
                const buttonStyle = getRouteButtonStyle(index, riskCounts)
                const isSelected = selectedRouteIndex === index
                return (
                  <button
                    key={index}
                    style={{
                      ...buttonStyle,
                      padding: "12px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: isSelected ? "bold" : "normal",
                      textAlign: "center",
                      position: "relative",
                      transform: isSelected ? "scale(1.02)" : "scale(1)",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => handleRouteSelection(index)}
                  >
                    <div style={{ fontWeight: "bold" }}>Route {index + 1}</div>
                    {riskCounts && safePathIndex === index && (
                      <div
                        style={{
                          fontSize: "10px",
                          marginTop: "2px",
                          backgroundColor: "rgba(255,255,255,0.2)",
                          borderRadius: "8px",
                          padding: "2px 4px",
                        }}
                      >
                        🛡️ SAFE
                      </div>
                    )}
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#fff",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. RISQUES */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "bold" }}>⚠️ Points de risque:</h4>
            {currentRiskData ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "18px" }}>{currentRiskData.riskCounts["élevé"] || 0}</div>
                  <div style={{ fontSize: "10px" }}>Élevés</div>
                </div>
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#ffc107",
                    color: "black",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "18px" }}>{currentRiskData.riskCounts["moyen"] || 0}</div>
                  <div style={{ fontSize: "10px" }}>Moyens</div>
                </div>
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#28a745",
                    color: "white",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                    {currentRiskData.riskCounts["faible"] || 0}
                  </div>
                  <div style={{ fontSize: "10px" }}>Faibles</div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  color: "#6c757d",
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                }}
              >
                {error ? `Erreur : ${error}` : "Analyse en cours..."}
              </div>
            )}
          </div>

          {/* 4. SAFE PATH (Carré au-dessus des boutons) */}
          {isExpanded && safePathIndex === selectedRouteIndex && currentRiskData && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#6f42c1",
                color: "white",
                borderRadius: "6px",
                textAlign: "center",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              <span>🛡️</span>
              <span>Safe Path Recommandé</span>
            </div>
          )}

          {/* 5. INSTRUCTIONS DÉTAILLÉES */}
          {showInstructions && currentInstructions.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "bold" }}>
                📋 Instructions de navigation:
              </h4>
              <div
                style={{
                  maxHeight: "150px",
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#fafafa",
                }}
              >
                {currentInstructions.map((instruction, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "10px",
                      fontSize: "12px",
                      borderBottom: index < currentInstructions.length - 1 ? "1px solid #eee" : "none",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#007bff",
                        color: "white",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        flexShrink: "0",
                      }}
                    >
                      {index + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "500", marginBottom: "2px" }}>{instruction.text}</div>
                      {instruction.distance > 0 && (
                        <div style={{ color: "#6c757d", fontSize: "11px" }}>
                          Distance: {formatDistance(instruction.distance)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message si pas d'instructions */}
          {showInstructions && currentInstructions.length === 0 && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "4px",
                color: "#856404",
                textAlign: "center",
              }}
            >
              Aucune instruction disponible pour cette route
            </div>
          )}

          {/* 6. BOUTONS D'ACTION */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <button
              style={{
                flex: 1,
                padding: "10px 15px",
                fontSize: "14px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "background-color 0.2s, transform 0.1s",
                fontWeight: "bold",
              }}
              onClick={() => {
                setShowInstructions(!showInstructions)
              }}
            >
              Détails
            </button>

            <button
              style={{
                flex: 1,
                padding: "10px 15px",
                fontSize: "14px",
                backgroundColor: "#6f42c1",
                color: "#fff",
                border: "none",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "background-color 0.2s, transform 0.1s",
                fontWeight: "bold",
              }}
              onClick={() => onShowAnalysis && onShowAnalysis()}
            >
              Analyse
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RouteInfo