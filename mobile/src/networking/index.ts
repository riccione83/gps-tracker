import axios from 'axios';
import {BASE_URL} from '../constants/App';
import {GPSPacket} from '../models/gps';
import {getData, storeData} from '../utils/storage';

export const sendGPSPacket = async (gps: GPSPacket) => {
  return axios
    .post(BASE_URL + '/gps', gps)
    .then(result => {
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
