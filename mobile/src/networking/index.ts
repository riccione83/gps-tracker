import axios from 'axios';
import {BASE_URL} from '../constants/App';
import {GPSPacket} from '../models/gps';
import {getData, storeData} from '../utils/storage';

export const sendGPSPacket = async (gps: GPSPacket) => {
  return axios
    .post(BASE_URL + '/gps', gps)
    .then(result => {
      console.info('GPS sent');
      return result;
    })
    .catch(async error => {
      console.info('Error, saving data');
      let history = (await getData('history')) as any[];
      if (history === null) {
        history = [];
        console.info('No history, creating one');
      }
      history.push(gps);
      storeData('history', history);
      console.info('Stored:', history);
      throw new Error(error);
    });
};

export const sendHistoricalGPSPacket = async (gps: GPSPacket[]) => {
  return axios
    .post(BASE_URL + '/sync', {history: gps})
    .then(result => {
      console.info('History data sent');
      return result;
    })
    .catch(async error => {
      console.info('Unable to send historic gps data');
      throw new Error(error);
    });
};

export const checkHistory = async () => {
  const history = (await getData('history')) as any[];
  console.info(`${history.length} messages to send`);
  if (history && history.length > 0) {
    const messages = [...history];
    console.info('Send new packet');
    try {
      await sendHistoricalGPSPacket(messages);
      await storeData('history', []);
    } catch {
      console.info('Unable to send historic message');
    }
  }
};
