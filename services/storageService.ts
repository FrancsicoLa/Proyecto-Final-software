import { Survey, VoteRecord, SecurityLogEntry } from '../types';

const KEYS = {
  SURVEYS: 'app_surveys',
  VOTES: 'app_votes',
  LOGS: 'app_security_logs',
  CLIENT_ID: 'app_client_id_simulated_ip'
};

// Genera o recupera un ID único para este navegador (Simula la IP)
export const getClientIp = (): string => {
  let id = localStorage.getItem(KEYS.CLIENT_ID);
  if (!id) {
    id = `192.168.x.${Math.floor(Math.random() * 255)}`; // Simulamos formato IP para visualización
    localStorage.setItem(KEYS.CLIENT_ID, id);
  }
  return id;
};

// ----- Surveys -----
export const getSurveys = (): Survey[] => {
  const data = localStorage.getItem(KEYS.SURVEYS);
  return data ? JSON.parse(data) : [];
};

export const saveSurvey = (survey: Survey): void => {
  const surveys = getSurveys();
  const existingIndex = surveys.findIndex(s => s.id === survey.id);
  if (existingIndex >= 0) {
    surveys[existingIndex] = survey;
  } else {
    surveys.push(survey);
  }
  localStorage.setItem(KEYS.SURVEYS, JSON.stringify(surveys));
};

export const saveAllSurveys = (surveys: Survey[]): void => {
  localStorage.setItem(KEYS.SURVEYS, JSON.stringify(surveys));
};

export const deleteSurvey = (id: string): void => {
  const surveys = getSurveys().filter(s => s.id !== id);
  localStorage.setItem(KEYS.SURVEYS, JSON.stringify(surveys));
};

// Incrementa el conteo de votos de una encuesta (Usado por el Admin cuando recibe MQTT)
export const incrementSurveyVote = (surveyId: string, optionId: string): void => {
  const surveys = getSurveys();
  const survey = surveys.find(s => s.id === surveyId);
  if (survey) {
    const option = survey.options.find(o => o.id === optionId);
    if (option) {
      option.votes += 1;
      // Guardamos todo el array de encuestas actualizado
      localStorage.setItem(KEYS.SURVEYS, JSON.stringify(surveys));
    }
  }
};

// ----- Votes -----
export const getVotes = (): VoteRecord[] => {
  const data = localStorage.getItem(KEYS.VOTES);
  return data ? JSON.parse(data) : [];
};

export const hasVoted = (surveyId: string, ip: string): boolean => {
  const votes = getVotes();
  return votes.some(v => v.surveyId === surveyId && v.voterIp === ip);
};

export const recordVote = (vote: VoteRecord): void => {
  const votes = getVotes();
  votes.push(vote);
  localStorage.setItem(KEYS.VOTES, JSON.stringify(votes));
  
  // También incrementamos el contador local para que el votante vea el cambio inmediato
  incrementSurveyVote(vote.surveyId, vote.optionId);
};

// ----- Logs -----
export const getLogs = (): SecurityLogEntry[] => {
  const data = localStorage.getItem(KEYS.LOGS);
  return data ? JSON.parse(data) : [];
};

export const logSecurityEvent = (entry: SecurityLogEntry): void => {
  const logs = getLogs();
  // Evitar logs duplicados exactos en corto tiempo
  const isDuplicate = logs.some(l => 
    l.surveyId === entry.surveyId && 
    l.voterIp === entry.voterIp && 
    l.timestamp > Date.now() - 5000
  );
  
  if (!isDuplicate) {
    logs.unshift(entry); // Add to beginning
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  }
};