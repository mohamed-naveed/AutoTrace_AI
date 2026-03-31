/**
 * cityCoords.js — Static coordinate lookup for Indian cities & states
 * Used by ProjectMap to resolve lat/lng from project state/location fields.
 */

// Major Indian cities → [lat, lng]
const CITY_COORDS = {
    // Maharashtra
    'mumbai': [19.0760, 72.8777],
    'mumbai central': [18.9712, 72.8193],
    'pune': [18.5204, 73.8567],
    'nagpur': [21.1458, 79.0882],
    'nashik': [19.9975, 73.7898],
    'thane': [19.2183, 72.9781],

    // Tamil Nadu
    'chennai': [13.0827, 80.2707],
    'coimbatore': [11.0168, 76.9558],
    'madurai': [9.9252, 78.1198],
    'trichy': [10.7905, 78.7047],
    'salem': [11.6643, 78.1460],
    'chengalpattu': [12.6921, 79.9764],
    'kanathur': [12.7935, 80.1948],

    // Karnataka
    'bengaluru': [12.9716, 77.5946],
    'bangalore': [12.9716, 77.5946],
    'mysore': [12.2958, 76.6394],
    'mangalore': [12.9141, 74.8560],
    'hubli': [15.3647, 75.1240],
    'whitefield': [12.9698, 77.7500],

    // Delhi NCR
    'delhi': [28.7041, 77.1025],
    'new delhi': [28.6139, 77.2090],
    'connaught place': [28.6315, 77.2167],
    'noida': [28.5355, 77.3910],
    'gurgaon': [28.4595, 77.0266],
    'gurugram': [28.4595, 77.0266],
    'faridabad': [28.4089, 77.3178],

    // Gujarat
    'ahmedabad': [23.0225, 72.5714],
    'surat': [21.1702, 72.8311],
    'vadodara': [22.3072, 73.1812],
    'gift city': [23.1171, 72.5797],
    'rajkot': [22.3039, 70.8022],

    // Telangana
    'hyderabad': [17.3850, 78.4867],
    'secunderabad': [17.4399, 78.4983],
    'warangal': [17.9784, 79.5941],

    // West Bengal
    'kolkata': [22.5726, 88.3639],
    'howrah': [22.5958, 88.2636],

    // Rajasthan
    'jaipur': [26.9124, 75.7873],
    'jodhpur': [26.2389, 73.0243],
    'udaipur': [24.5854, 73.7125],

    // Uttar Pradesh
    'lucknow': [26.8467, 80.9462],
    'kanpur': [26.4499, 80.3319],
    'varanasi': [25.3176, 82.9739],
    'agra': [27.1767, 78.0081],

    // Kerala
    'kochi': [9.9312, 76.2673],
    'thiruvananthapuram': [8.5241, 76.9366],
    'kozhikode': [11.2588, 75.7804],

    // Madhya Pradesh
    'bhopal': [23.2599, 77.4126],
    'indore': [22.7196, 75.8577],

    // Punjab & Haryana
    'chandigarh': [30.7333, 76.7794],
    'amritsar': [31.6340, 74.8723],
    'ludhiana': [30.9010, 75.8573],

    // Odisha
    'bhubaneswar': [20.2961, 85.8245],

    // Assam
    'guwahati': [26.1445, 91.7362],

    // Bihar
    'patna': [25.6093, 85.1376],

    // Jharkhand
    'ranchi': [23.3441, 85.3096],

    // Uttarakhand
    'dehradun': [30.3165, 78.0322],

    // Himachal Pradesh
    'shimla': [31.1048, 77.1734],

    // Goa
    'panaji': [15.4909, 73.8278],

    // Andhra Pradesh
    'visakhapatnam': [17.6868, 83.2185],
    'vijayawada': [16.5062, 80.6480],

    // Chhattisgarh
    'raipur': [21.2514, 81.6296],
}

// State capitals fallback → [lat, lng]
const STATE_COORDS = {
    'andhra pradesh': [15.9129, 79.7400],
    'arunachal pradesh': [27.1004, 93.6166],
    'assam': [26.1445, 91.7362],
    'bihar': [25.6093, 85.1376],
    'chhattisgarh': [21.2514, 81.6296],
    'goa': [15.4909, 73.8278],
    'gujarat': [23.0225, 72.5714],
    'haryana': [28.4595, 77.0266],
    'himachal pradesh': [31.1048, 77.1734],
    'jharkhand': [23.3441, 85.3096],
    'karnataka': [12.9716, 77.5946],
    'kerala': [9.9312, 76.2673],
    'madhya pradesh': [23.2599, 77.4126],
    'maharashtra': [19.0760, 72.8777],
    'manipur': [24.8170, 93.9368],
    'meghalaya': [25.5788, 91.8933],
    'mizoram': [23.7271, 92.7176],
    'nagaland': [25.6747, 94.1086],
    'odisha': [20.2961, 85.8245],
    'punjab': [30.9010, 75.8573],
    'rajasthan': [26.9124, 75.7873],
    'sikkim': [27.3389, 88.6065],
    'tamil nadu': [13.0827, 80.2707],
    'telangana': [17.3850, 78.4867],
    'tripura': [23.8315, 91.2868],
    'uttar pradesh': [26.8467, 80.9462],
    'uttarakhand': [30.3165, 78.0322],
    'west bengal': [22.5726, 88.3639],
    'andaman & nicobar islands': [11.7401, 92.6586],
    'chandigarh': [30.7333, 76.7794],
    'dadra & nagar haveli': [20.1809, 73.0169],
    'daman & diu': [20.4283, 72.8397],
    'delhi': [28.7041, 77.1025],
    'jammu & kashmir': [33.7782, 76.5762],
    'ladakh': [34.1526, 77.5771],
    'lakshadweep': [10.5667, 72.6417],
    'puducherry': [11.9416, 79.8083],
}

// India center fallback
const INDIA_CENTER = [20.5937, 78.9629]

/**
 * Resolve lat/lng coordinates for a project from its location/state fields.
 * @param {Object} project - Must have `location` and `state` fields
 * @returns {[number, number]} [lat, lng]
 */
export function getProjectCoords(project) {
    const location = (project.location || '').toLowerCase().trim()
    const state = (project.state || '').toLowerCase().trim()

    // Try exact city match first
    if (location && CITY_COORDS[location]) {
        return CITY_COORDS[location]
    }

    // Try partial match on location
    if (location) {
        for (const [city, coords] of Object.entries(CITY_COORDS)) {
            if (location.includes(city) || city.includes(location)) {
                return coords
            }
        }
    }

    // Fallback to state capital
    if (state && STATE_COORDS[state]) {
        return STATE_COORDS[state]
    }

    // Ultimate fallback: India center
    return INDIA_CENTER
}

export { INDIA_CENTER, CITY_COORDS, STATE_COORDS }
