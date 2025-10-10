const envApiUrl = import.meta.env.VITE_API_URL;
const envSocketUrl = import.meta.env.VITE_SOCKET_URL;

export const API_URL = envApiUrl !== undefined ? envApiUrl : 'http://localhost:3000';
export const SOCKET_URL = envSocketUrl !== undefined ? envSocketUrl : 'http://localhost:3000';

const DEFAULT_ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const parseIceServers = () => {
  const rawIceServers = import.meta.env.VITE_WEBRTC_ICE_SERVERS;

  if (rawIceServers) {
    try {
      const parsed = JSON.parse(rawIceServers);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (error) {
      console.warn('Invalid VITE_WEBRTC_ICE_SERVERS JSON. Falling back to defaults.', error);
    }
  }

  const meteredUsername = import.meta.env.VITE_METERED_USERNAME;
  const meteredCredential = import.meta.env.VITE_METERED_CREDENTIAL;
  const meteredStunUrl = import.meta.env.VITE_METERED_STUN_URL || 'stun:stun.relay.metered.ca:80';

  const meteredTurnUrls = [
    import.meta.env.VITE_METERED_TURN_UDP_URL || 'turn:global.relay.metered.ca:80',
    import.meta.env.VITE_METERED_TURN_TCP_URL || 'turn:global.relay.metered.ca:80?transport=tcp',
    import.meta.env.VITE_METERED_TURN_TLS_URL || 'turn:global.relay.metered.ca:443',
    import.meta.env.VITE_METERED_TURN_TLS_TCP_URL || 'turns:global.relay.metered.ca:443?transport=tcp'
  ].filter(Boolean);

  if (meteredUsername && meteredCredential) {
    return [
      { urls: meteredStunUrl },
      {
        urls: meteredTurnUrls,
        username: meteredUsername,
        credential: meteredCredential,
      },
    ];
  }

  return DEFAULT_ICE_SERVERS;
};

export const WEBRTC_ICE_SERVERS = parseIceServers();

const config = {
  API_URL,
  SOCKET_URL,
  WEBRTC_ICE_SERVERS,
};

export default config;