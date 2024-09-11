import faceapi from 'face-api.js';
import { Canvas, Image, ImageData } from 'canvas';
import cloudinary from "../config/cloudinary.js";
import User from '../models/User.js';

// Configure face-api.js to use the fake Canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const uploadToCloudinary = async (base64Image) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Image,
      { upload_preset: 'ml_default' },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result.url);
      }
    );
  });
};

const loadModels = async () => {
  const MODEL_URL = './models'; // Path to face-api models
  await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
};

export const signup = async (username, base64Image) => {
  try {
    await loadModels();
    const imageUrl = await uploadToCloudinary(base64Image);
    
    const img = await canvas.loadImage(imageUrl);
    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

    if (detections.length > 0) {
      const faceDescriptor = detections[0].descriptor;
      const user = new User({ username, faceDescriptor });
      await user.save();
      return { success: true, message: 'User signed up' };
    } else {
      return { success: false, message: 'No face detected' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const login = async (base64Image) => {
  try {
    await loadModels();
    const imageUrl = await uploadToCloudinary(base64Image);

    const img = await canvas.loadImage(imageUrl);
    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

    if (detections.length > 0) {
      const faceDescriptor = detections[0].descriptor;
      const users = await User.find({});
      let authenticated = false;
      let userFound = null;

      for (const user of users) {
        const distance = faceapi.euclideanDistance(user.faceDescriptor, faceDescriptor);

        if (distance < 0.6) { // Adjust threshold as needed
          authenticated = true;
          userFound = user;
          if (user.status === 'off duty') {
            user.checkInTime = new Date();
            user.status = 'on duty';
            await user.save();
          }
          break;
        }
      }

      return { success: authenticated, user: userFound };
    } else {
      return { success: false, message: 'No face detected' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const logout = async (base64Image) => {
  try {
    await loadModels();
    const imageUrl = await uploadToCloudinary(base64Image);

    const img = await canvas.loadImage(imageUrl);
    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

    if (detections.length > 0) {
      const faceDescriptor = detections[0].descriptor;
      const users = await User.find({});
      let authenticated = false;
      let userFound = null;

      for (const user of users) {
        const distance = faceapi.euclideanDistance(user.faceDescriptor, faceDescriptor);

        if (distance < 0.6) { // Adjust threshold as needed
          authenticated = true;
          userFound = user;
          if (user.status === 'on duty') {
            user.checkOutTime = new Date();
            user.status = 'off duty';
            await user.save();
          }
          break;
        }
      }

      return { success: authenticated, user: userFound };
    } else {
      return { success: false, message: 'No face detected' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};
