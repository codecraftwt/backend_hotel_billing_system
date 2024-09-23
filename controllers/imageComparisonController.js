// // import fs from 'fs/promises';
// // import path from 'path';
// // import { fileURLToPath } from 'url';
// // import { ImageComparator } from '../imageComparator.js';

// // // Resolve __dirname correctly
// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// // // Adjust UPLOAD_DIR based on your actual directory structure
// // const UPLOAD_DIR = path.resolve(__dirname, '../uploads');

// // // Function to get all images in the directory
// // const getAllImages = async () => {
// //     try {
// //         const files = await fs.readdir(UPLOAD_DIR);
// //         return files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)); // Adjust regex to match image formats
// //     } catch (err) {
// //         console.error('Error reading uploads directory:', err);
// //         throw err;
// //     }
// // };

// // export const compareWithStoredImage = async (req, res) => {
// //     try {
// //         // Check if the uploaded file is present
// //         if (!req.file) {
// //             return res.status(400).send('Uploaded image is required.');
// //         }

// //         const uploadedImagePath = path.resolve(req.file.path);
// //         const images = await getAllImages();

// //         // Iterate over each image and compare
// //         for (const storedImageName of images) {
// //             const storedImagePath = path.resolve(UPLOAD_DIR, storedImageName);
// //             console.log('Comparing with:', storedImagePath);

// //             const comparator = new ImageComparator(uploadedImagePath, storedImagePath);
// //             const result = await comparator.compareImages();

// //             if (result === "The images are the same.") {
// //                 // Clean up uploaded file
// //                 try {
// //                     await fs.unlink(uploadedImagePath);
// //                 } catch (cleanupError) {
// //                     console.error(`Failed to delete ${uploadedImagePath}: ${cleanupError.message}`);
// //                 }

// //                 return res.send({ message: 'Success: Matching image found.', storedImageName });
// //             }
// //         }

// //         // No matching image found
// //         res.status(404).send('Error: No matching image found.');
// //     } catch (error) {
// //         console.error('Error comparing images:', error);
// //         res.status(500).send(`An error occurred: ${error.message}`);
// //     }
// // };
// import fs from 'fs/promises';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import cloudinary from '../config/cloudinary.js'; // Adjust import path
// import axios from 'axios';
// import { ImageComparator } from '../imageComparator.js'; // Adjust import path
// import User from '../models/User.js';

// // Resolve __dirname correctly
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Adjust UPLOAD_DIR based on your actual directory structure
// const UPLOAD_DIR = path.resolve(__dirname, '../uploads');

// // Function to download an image from a URL
// const downloadImage = async (url, savePath) => {
//     const response = await axios.get(url, { responseType: 'arraybuffer' });
//     await fs.writeFile(savePath, response.data);
// };

// // Function to get all image URLs from Cloudinary under the 'face_scans' folder
// const getAllImageUrls = async () => {
//     try {
//         const result = await cloudinary.api.resources({
//             type: 'upload',
//             prefix: 'face_scans/', // Folder name in Cloudinary
//             resource_type: 'image'
//         });
//         return result.resources.map(image => image.secure_url);
//     } catch (err) {
//         console.error('Error fetching images from Cloudinary:', err);
//         throw err;
//     }
// };

// // export const compareWithStoredImage = async (req, res) => {
// //     try {
// //         // Check if the uploaded file is present
// //         if (!req.file) {
// //             return res.status(400).send('Uploaded image is required.');
// //         }

// //         const uploadedImagePath = path.resolve(req.file.path);
// //         // const uploadedImage = await cloudinary.uploader.upload(uploadedImagePath, {
// //         //     folder: 'face_scans' // Upload to the 'face_scans' folder
// //         // });

// //         // const uploadedImageUrl = uploadedImage.secure_url;
// //         const imageUrls = await getAllImageUrls();
// //         console.log(imageUrls,'imageUrls');
        
// //         // Temporary paths for downloaded images
// //         const tempPath = path.join(__dirname, 'temp');
// //         await fs.mkdir(tempPath, { recursive: true });

// //         // Iterate over each image URL, download, and compare
// //         for (const storedImageUrl of imageUrls) {
// //             console.log('Comparing with:', storedImageUrl);

// //             const storedImagePath = path.join(tempPath, path.basename(storedImageUrl));
// //             await downloadImage(storedImageUrl, storedImagePath);
// //             console.log(uploadedImagePath,'uploadedImagePath');
// //             console.log(storedImagePath,'storedImagePath');
            
// //             const comparator = new ImageComparator(uploadedImagePath, storedImagePath);
// //             console.log(comparator,'comparator');
            
// //             const result = await comparator.compareImages();
// //             console.log(result,'result');
            
// //             if (result === "The images are the same.") {
// //                 // Clean up uploaded and temporary files
// //                 try {
// //                     await fs.unlink(uploadedImagePath);
// //                     await fs.unlink(storedImagePath);
// //                     await fs.rmdir(tempPath);
// //                 } catch (cleanupError) {
// //                     console.error(`Failed to delete files: ${cleanupError.message}`);
// //                 }

// //                 return res.send({ message: 'Success: Matching image found.', storedImageUrl });
// //             }
// //         }

// //         // Clean up uploaded file
// //         try {
// //             await fs.unlink(uploadedImagePath);
// //             await fs.rmdir(tempPath);
// //         } catch (cleanupError) {
// //             console.error(`Failed to delete files: ${cleanupError.message}`);
// //         }

// //         // No matching image found
// //         res.status(404).send('Error: No matching image found.');
// //     } catch (error) {
// //         console.error('Error comparing images:', error);
// //         res.status(500).send(`An error occurred: ${error.message}`);
// //     }
// // };



// export const compareWithStoredImage = async (req, res) => {
//     let uploadedImagePath;
//     const tempPath = path.join(__dirname, 'temp');

//     try {
//         // Check if the image in Base64 format is present
//         const { image } = req.body;
//         if (!image || typeof image !== 'string') {
//             return res.status(400).send('Uploaded image is required and must be a string.');
//         }

//         // Convert Base64 image to a temporary file
//         uploadedImagePath = path.join(tempPath, 'uploaded_image.png');
//         const base64Data = image.split(',')[1]; // Remove metadata if present
//         await fs.mkdir(tempPath, { recursive: true });

//         // Cleanup any existing files
//         try {
//             await fs.unlink(uploadedImagePath);
//         } catch (error) {
//             if (error.code !== 'ENOENT') {
//                 console.error(`Failed to delete existing uploaded image: ${error.message}`);
//             }
//         }
        
//         await fs.writeFile(uploadedImagePath, base64Data, 'base64');

//         // Retrieve all users and their image URLs
//         const users = await User.find();

//         // Iterate over each user and compare images
//         for (const user of users) {
//             const storedImageUrl = user.imageUrl;
//             const storedImagePath = path.join(tempPath, path.basename(storedImageUrl));

//             // Download the stored image to a temporary file
//             await downloadImage(storedImageUrl, storedImagePath);

//             const comparator = new ImageComparator(uploadedImagePath, uploadedImagePath);
//             const result = await comparator.compareImages();

//             if (result === "The images are the same.") {
//                 // Clean up temporary files
//                 await fs.unlink(uploadedImagePath);
//                 await fs.unlink(storedImagePath);
//                 return res.send({ message: 'Success: Matching image found.', userId: user._id, userName: user.name, imageUrl: user.imageUrl });
//             }
//         }

//         // Clean up uploaded file
//         await fs.unlink(uploadedImagePath);
//         res.status(404).send('Error: No matching image found.');
//     } catch (error) {
//         console.error('Error comparing images:', error);
//         res.status(500).send(`An error occurred: ${error.message}`);
//     } finally {
//         // Cleanup temp directory if needed
//         try {
//             await fs.rmdir(tempPath, { recursive: true });
//         } catch (cleanupError) {
//             console.error(`Failed to delete temp directory: ${cleanupError.message}`);
//         }
//     }
// };