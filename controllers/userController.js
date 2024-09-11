import * as faceRecognitionService from '../services/faceRecognitionService.js';

export const signup = async (req, res) => {
  const { username, photo } = req.body;
  const result = await faceRecognitionService.signup(username, photo);
  res.json(result);
};

export const login = async (req, res) => {
  const { photo } = req.body;
  const result = await faceRecognitionService.login(photo);
  res.json(result);
};

export const logout = async (req, res) => {
  const { photo } = req.body;
  const result = await faceRecognitionService.logout(photo);
  res.json(result);
};
