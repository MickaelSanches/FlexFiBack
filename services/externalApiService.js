const axios = require("axios");
const querystring = require("querystring");

const getBusinessInfo = async (sirenOrSiret) => {
  const url = "https://api.insee.fr/entreprises/sirene/V3.11/siren";
  const params = {
    q: `siren:${sirenOrSiret}`,
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

    // Filtrage des données pertinentes
    const uniteLegale = response.data.unitesLegales[0];
    const periodeActive = uniteLegale.periodesUniteLegale.find(
      (periode) => !periode.dateFin
    );

    const businessInfo = {
      siren: uniteLegale.siren,
      denomination: periodeActive.denominationUniteLegale,
      activitePrincipale: periodeActive.activitePrincipaleUniteLegale,
      categorieJuridique: uniteLegale.categorieJuridiqueUniteLegale,
      dateCreation: uniteLegale.dateCreationUniteLegale,
    };

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
