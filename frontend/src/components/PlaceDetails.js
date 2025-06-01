const PlaceDetails = ({ placeDetails, showDetails, expandedCard, toggleCard, handleDirectionsClick, isCalculatingRoute, showRouteInfo }) => {
  if (!placeDetails || !showDetails) return null;

  // Fonction pour obtenir l'icône en fonction du type de lieu
  const getPlaceIcon = (type) => {
    const typeLC = type.toLowerCase();
    if (typeLC.includes("point personnalisé")) return "📍";
    if (typeLC.includes("restaurant")) return "🍽️";
    if (typeLC.includes("hôtel")) return "🏨";
    if (typeLC.includes("café")) return "☕";
    if (typeLC.includes("magasin")) return "🏪";
    if (typeLC.includes("parc")) return "🌳";
    if (typeLC.includes("école")) return "🏫";
    if (typeLC.includes("hôpital")) return "🏥";
    if (typeLC.includes("gare")) return "🚉";
    if (typeLC.includes("aéroport")) return "✈️";
    if (typeLC.includes("banque")) return "🏦";
    if (typeLC.includes("sport")) return "⚽";
    if (typeLC.includes("plage")) return "🏖️";
    if (typeLC.includes("mosquée")) return "🕌";
    if (typeLC.includes("église")) return "⛪";
    if (typeLC.includes("synagogue")) return "🕍";
    return "📌";
  };

  const isExpanded = expandedCard === 'place';
  
  return (
    <div 
      style={{
        position: "fixed",
        top: "0",
        right: "0",
        width: isExpanded ? "250px" : "40px",
        height: "180px",
        background: "#fff",
        borderRadius: "0 0 0 10px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 998,
        display: "flex",
        transition: "all 0.3s ease",
        overflow: "hidden",
        marginBottom: "10px"
      }}
    >
      {/* Header vertical */}
      <div
        onClick={() => toggleCard('place')}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "40px",
          height: "100%",
          background: "linear-gradient(180deg, #0056b3, #dc3545)",
          cursor: "pointer",
          fontWeight: "500",
          fontSize: "14px",
          color: "#fff",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          padding: "15px 5px",
        }}
      >
        <span style={{
          transform: "rotate(180deg)",
          whiteSpace: "nowrap",
          marginBottom: "10px",
        }}>Destination</span>
        <span style={{ 
          fontSize: "16px", 
          transform: "rotate(180deg)"
        }}>{isExpanded ? "◄" : "►"}</span>
      </div>

      {/* Contenu */}
      <div style={{ 
        padding: "15px", 
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>
        {/* En-tête */}
        <div style={{ 
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <span style={{ fontSize: "24px" }}>{getPlaceIcon(placeDetails.type || "point personnalisé")}</span>
          <div>
            <h3 style={{ 
              margin: "0",
              fontSize: "16px",
              color: "#2c3e50",
              fontWeight: "600"
            }}>
              {placeDetails.name || "Destination personnalisée"}
            </h3>
            <p style={{ 
              margin: "5px 0 0 0",
              fontSize: "14px",
              color: "#6c757d"
            }}>
              {placeDetails.type || "Point personnalisé"}
            </p>
          </div>
        </div>

        {/* Informations */}
        <div style={{
          backgroundColor: "#f8f9fa",
          padding: "12px",
          borderRadius: "8px"
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span style={{ color: "#0056b3" }}>🎯</span>
              <span style={{ fontSize: "14px" }}>Position sélectionnée</span>
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              fontSize: "13px",
              color: "#6c757d",
              paddingLeft: "25px"
            }}>
              <div>Lat: {Number(placeDetails.lat).toFixed(6)}</div>
              <div>Lon: {Number(placeDetails.lon).toFixed(6)}</div>
            </div>
          </div>
        </div>

        {/* Bouton */}
        <button
          onClick={handleDirectionsClick}
          disabled={isCalculatingRoute}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: showRouteInfo ? "#dc3545" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isCalculatingRoute ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s",
            opacity: isCalculatingRoute ? 0.7 : 1,
            marginTop: "auto"
          }}
        >
          <span>{showRouteInfo ? "🚫" : "🚗"}</span>
          <span>
            {isCalculatingRoute 
              ? "Calcul en cours..." 
              : showRouteInfo 
                ? "Masquer l'itinéraire" 
                : "Calculer l'itinéraire"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default PlaceDetails;
