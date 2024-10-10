const axios = require("axios");
const querystring = require("querystring");

const getBusinessInfo = async (sirenOrSiret) => {
  // Vérifier si l'entrée est un SIREN (9 chiffres) ou un SIRET (14 chiffres)
  const isSiret = sirenOrSiret.length === 14;
  const url = isSiret
    ? "https://api.insee.fr/entreprises/sirene/V3.11/siret"
    : "https://api.insee.fr/entreprises/sirene/V3.11/siren";

  const params = {
    q: `${isSiret ? "siret" : "siren"}:${sirenOrSiret}`,
    nombre: 1,
    champs:
      "siren,categorieJuridiqueUniteLegale,activitePrincipaleUniteLegale,denominationUniteLegale,dateCreationUniteLegale",
  };

  try {
    const response = await axios.post(url, querystring.stringify(params), {
      headers: {
        Authorization: `Bearer ${process.env.INSEE_API_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Vérifier si les données sont disponibles
    if (
      !response.data.unitesLegales ||
      response.data.unitesLegales.length === 0
    ) {
      throw new Error("Aucune information d'entreprise trouvée.");
    }

    const uniteLegale = response.data.unitesLegales[0];
    const periodeActive = uniteLegale.periodesUniteLegale.find(
      (periode) => !periode.dateFin
    );

    const businessInfo = {
      siren: uniteLegale.siren,
      denomination: periodeActive?.denominationUniteLegale || "Non disponible",
      activite_principale:
        periodeActive?.activitePrincipaleUniteLegale || "Non disponible",
      categorie_juridique:
        uniteLegale.categorieJuridiqueUniteLegale || "Non disponible",
      date_creation: uniteLegale.dateCreationUniteLegale || "Non disponible",
    };

    console.log("___________ pro eternal API, business info : ", businessInfo);

    return businessInfo;
  } catch (error) {
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else {
      console.error("Error fetching business info:", error.message);
    }
    throw new Error("Unable to retrieve business information.");
  }
};

module.exports = {
  getBusinessInfo,
};
