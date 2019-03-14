import today from './today'

const api = 'https://api.foursquare.com/v2/venues/search';
const clientId = 'HCFKSRBOE34ZWFFURMZYDY1F4HT2D3OHGOXFMU12H5Y3LTVU';
const clientSecret = 'G4MBBX2XNBGQJYQ3QJJY1N2ZPVTB1R05CHPT5N5LM3X4P5IL';

// 类别 id
// 详情：https://developer.foursquare.com/docs/resources/categories
const categoryId =
  // '4bf58dd8d48988d1f8931735,' +  // Bed & Breakfast
  '4bf58dd8d48988d1ee931735,' +  // Hostel
  '5bae9231bedf3950379f89cb,' +  // Inn
  '4bf58dd8d48988d1fb931735';    // Motel

export const getNearby = (sw, ne, query) =>
  fetch(`${api}
    ?client_id=${clientId}
    &client_secret=${clientSecret}
    &category_id=${categoryId}
    &v=${today()}
    &query=${query}
    &sw=${sw}
    &ne=${ne}
    &intent=browse
    `.replace(/[\n\s]*/gm, ''))
    .then(res => res.json());
