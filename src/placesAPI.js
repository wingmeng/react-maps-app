import today from './tools/today';

const api = 'https://api.foursquare.com/v2/venues/';
const clientId = 'HCFKSRBOE34ZWFFURMZYDY1F4HT2D3OHGOXFMU12H5Y3LTVU';
const clientSecret = 'G4MBBX2XNBGQJYQ3QJJY1N2ZPVTB1R05CHPT5N5LM3X4P5IL';

// 类别 id
// 详情：https://developer.foursquare.com/docs/resources/categories
const categoryId =
  '4bf58dd8d48988d1e2931735'  // Art Gallery
  // '4bf58dd8d48988d1f8931735,' +  // Bed & Breakfast
  // '4bf58dd8d48988d1ee931735,' +  // Hostel
  // '5bae9231bedf3950379f89cb,' +  // Inn
  // '4bf58dd8d48988d1fb931735';    // Motel

// 搜索地点列表
// https://developer.foursquare.com/docs/api/venues/search  
export const searchList = (sw, ne, query) => {
  if (!(sw && ne)) {
    return new Error(`\`sw\` or \`ne\` is required`)
  }

  return fetch(`${api}/search
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
}

// 地点详情
// https://developer.foursquare.com/docs/api/venues/details
export const getDetails = (PlaceId) =>
  fetch(`${api}/${PlaceId}
    ?client_id=${clientId}
    &client_secret=${clientSecret}
    &id=${PlaceId}
    &v=${today()}
    `.replace(/[\n\s]*/gm, ''))
    .then(res => res.json());

// 地点照片
// https://developer.foursquare.com/docs/api/venues/photos
export const getPhotos = (PlaceId) =>
  fetch(`${api}/${PlaceId}/photos
    ?client_id=${clientId}
    &client_secret=${clientSecret}
    `.replace(/[\n\s]*/gm, ''))
    .then(res => res.json());     