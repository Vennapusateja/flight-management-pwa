// Comprehensive list of Indian airports with IATA codes
// Used for the autocomplete search in FlightSearchForm.

export interface Airport {
  code: string;   // 3-letter IATA code
  city: string;
  name: string;
}

export const AIRPORTS: Airport[] = [
  { code: 'DEL', city: 'New Delhi',        name: 'Indira Gandhi International Airport' },
  { code: 'BOM', city: 'Mumbai',           name: 'Chhatrapati Shivaji Maharaj International Airport' },
  { code: 'BLR', city: 'Bengaluru',        name: 'Kempegowda International Airport' },
  { code: 'MAA', city: 'Chennai',          name: 'Chennai International Airport' },
  { code: 'HYD', city: 'Hyderabad',        name: 'Rajiv Gandhi International Airport' },
  { code: 'CCU', city: 'Kolkata',          name: 'Netaji Subhas Chandra Bose International Airport' },
  { code: 'AMD', city: 'Ahmedabad',        name: 'Sardar Vallabhbhai Patel International Airport' },
  { code: 'PNQ', city: 'Pune',             name: 'Pune International Airport' },
  { code: 'COK', city: 'Kochi',            name: 'Cochin International Airport' },
  { code: 'GOI', city: 'Goa',              name: 'Goa International Airport' },
  { code: 'JAI', city: 'Jaipur',           name: 'Jaipur International Airport' },
  { code: 'LKO', city: 'Lucknow',          name: 'Chaudhary Charan Singh International Airport' },
  { code: 'IXC', city: 'Chandigarh',       name: 'Chandigarh International Airport' },
  { code: 'ATQ', city: 'Amritsar',         name: 'Sri Guru Ram Dass Jee International Airport' },
  { code: 'VNS', city: 'Varanasi',         name: 'Lal Bahadur Shastri International Airport' },
  { code: 'BBI', city: 'Bhubaneswar',      name: 'Biju Patnaik International Airport' },
  { code: 'NAG', city: 'Nagpur',           name: 'Dr. Babasaheb Ambedkar International Airport' },
  { code: 'VTZ', city: 'Visakhapatnam',    name: 'Visakhapatnam Airport' },
  { code: 'SXR', city: 'Srinagar',         name: 'Sheikh ul-Alam International Airport' },
  { code: 'IXB', city: 'Bagdogra',         name: 'Bagdogra Airport' },
  { code: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum International Airport' },
  { code: 'CJB', city: 'Coimbatore',       name: 'Coimbatore International Airport' },
  { code: 'IXZ', city: 'Port Blair',       name: 'Veer Savarkar International Airport' },
  { code: 'GAU', city: 'Guwahati',         name: 'Lokpriya Gopinath Bordoloi International Airport' },
  { code: 'RPR', city: 'Raipur',           name: 'Swami Vivekananda Airport' },
  { code: 'BHO', city: 'Bhopal',           name: 'Raja Bhoj Airport' },
  { code: 'IDR', city: 'Indore',           name: 'Devi Ahilya Bai Holkar Airport' },
  { code: 'PAT', city: 'Patna',            name: 'Jay Prakash Narayan International Airport' },
  { code: 'IXM', city: 'Madurai',          name: 'Madurai Airport' },
  { code: 'TIR', city: 'Tirupati',         name: 'Tirupati Airport' },
  { code: 'IXL', city: 'Leh',              name: 'Kushok Bakula Rimpochee Airport' },
  { code: 'DED', city: 'Dehradun',         name: 'Jolly Grant Airport' },
  { code: 'JDH', city: 'Jodhpur',          name: 'Jodhpur Airport' },
  { code: 'UDR', city: 'Udaipur',          name: 'Maharana Pratap Airport' },
  { code: 'BDQ', city: 'Vadodara',         name: 'Vadodara Airport' },
  { code: 'RAJ', city: 'Rajkot',           name: 'Rajkot Airport' },
  { code: 'STV', city: 'Surat',            name: 'Surat Airport' },
  { code: 'HBX', city: 'Hubli',            name: 'Hubli Airport' },
  { code: 'MYQ', city: 'Mysuru',           name: 'Mysore Airport' },
  { code: 'IXE', city: 'Mangaluru',        name: 'Mangalore International Airport' },
  { code: 'TRZ', city: 'Tiruchirappalli',  name: 'Tiruchirappalli International Airport' },
  { code: 'IMP', city: 'Imphal',           name: 'Imphal Airport' },
  { code: 'DIB', city: 'Dibrugarh',        name: 'Dibrugarh Airport' },
  { code: 'AGX', city: 'Agartala',         name: 'Maharaja Bir Bikram Airport' },
  { code: 'AYJ', city: 'Aizawl',           name: 'Lengpui Airport' },
  { code: 'IMF', city: 'Imphal',           name: 'Imphal International Airport' },
  { code: 'KLH', city: 'Kolhapur',         name: 'Kolhapur Airport' },
  { code: 'PUT', city: 'Puttur',           name: 'Puttur Airport' },
  { code: 'DHM', city: 'Dharamsala',       name: 'Gaggal Airport' },
  { code: 'KUU', city: 'Kullu',            name: 'Bhuntar Airport' },
  { code: 'SLV', city: 'Shimla',           name: 'Shimla Airport' },
];

/**
 * Filters airports by IATA code, city, or airport name.
 * Returns up to `limit` results sorted by relevance (code match first).
 */
export function searchAirports(query: string, limit = 8): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: Array<{ airport: Airport; score: number }> = [];

  for (const airport of AIRPORTS) {
    const code = airport.code.toLowerCase();
    const city = airport.city.toLowerCase();
    const name = airport.name.toLowerCase();

    let score = 0;

    if (code === q)           score = 100;
    else if (code.startsWith(q)) score = 90;
    else if (city === q)      score = 80;
    else if (city.startsWith(q)) score = 70;
    else if (city.includes(q))   score = 50;
    else if (name.includes(q))   score = 30;
    else if (code.includes(q))   score = 20;

    if (score > 0) results.push({ airport, score });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.airport);
}
