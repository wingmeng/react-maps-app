const api = 'https://api.foursquare.com/v2/venues/search';
const clientId = 'HCFKSRBOE34ZWFFURMZYDY1F4HT2D3OHGOXFMU12H5Y3LTVU';
const clientSecret = 'G4MBBX2XNBGQJYQ3QJJY1N2ZPVTB1R05CHPT5N5LM3X4P5IL';

export const getNearby = (lat, lng) =>
  fetch(`${api}?
    client_id=${clientId}
    &client_secret=${clientSecret}
    &v=20190313
    &ll=${lat},${lng}
    &query=hotel`.replace(/[\n\s]*/gm, ''))
    .then(res => res.json());
