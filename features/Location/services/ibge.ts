import { IBGEState, IBGECity } from '../../../types';
import { IGUATU_NEIGHBORHOODS } from '../../../constants';

const IBGE_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

// Exporta a lista oficial do seu sistema para ser usada nos modais
export const BAIRROS_IGUATU = IGUATU_NEIGHBORHOODS;

// --- SERVIÇOS DO IBGE (Para os Dropdowns/Selects) ---

export const getStates = async (): Promise<IBGEState[]> => {
  try {
    const response = await fetch(`${IBGE_BASE_URL}/estados?orderBy=nome`);
    if (!response.ok) throw new Error('Failed to fetch states');
    return await response.json();
  } catch (error) {
    console.error('IBGE API Error:', error);
    return [];
  }
};

export const getCitiesByState = async (uf: string): Promise<IBGECity[]> => {
  try {
    const response = await fetch(`${IBGE_BASE_URL}/estados/${uf}/municipios?orderBy=nome`);
    if (!response.ok) throw new Error('Failed to fetch cities');
    return await response.json();
  } catch (error) {
    console.error('IBGE API Error:', error);
    return [];
  }
};

// --- SERVIÇO DE BUSCA POR NOME (OpenStreetMap) ---
// Mantido pois a barra de busca "Onde você está?" usa isso.
export const searchAddressByQuery = async (query: string) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&countrycodes=br&limit=5`
    );
    const data = await response.json();

    return data.map((item: any) => ({
      logradouro: item.address.road || item.address.pedestrian || item.display_name.split(',')[0],
      bairro: item.address.suburb || item.address.neighbourhood || '',
      localidade: item.address.city || item.address.town || item.address.village || '',
      uf: item.address.state ? getStateSigla(item.address.state) : ''
    }));
  } catch (error) {
    console.error("Erro ao buscar endereço:", error);
    return [];
  }
};

// Helper para converter nomes de estados em siglas (pois o OpenStreet retorna nome completo)
const getStateSigla = (stateName: string) => {
  const states: {[key: string]: string} = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA',
    'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO',
    'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
    'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE', 'Piauí': 'PI',
    'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
    'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
    'Sergipe': 'SE', 'Tocantins': 'TO'
  };
  return states[stateName] || stateName;
};
