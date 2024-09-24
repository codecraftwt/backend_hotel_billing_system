// import fs from 'fs/promises'; // Use fs.promises for async operations
// import path from 'path';
// import { ImageComparator } from '../imageComparator.js';
// import cloudinary from '../config/cloudinary.js';
// import User from '../models/User.js';
// import axios from 'axios';

// // export const compareImages = async (req, res) => {
// //     try {
// //         if (!req.files || !req.files.image1 || !req.files.image2) {
// //             return res.status(400).send('Both images are required.');
// //         }

// //         const imagePath1 = path.resolve(req.files.image1[0].path);
// //         const imagePath2 = path.resolve(req.files.image2[0].path);

// //         const comparator = new ImageComparator(imagePath1, imagePath2);
// //         const result = await comparator.compareImages();

// //         // Clean up uploaded files
// //         await Promise.all([
// //             fs.unlink(imagePath1).catch(err => console.error(`Failed to delete ${imagePath1}: ${err.message}`)),
// //             fs.unlink(imagePath2).catch(err => console.error(`Failed to delete ${imagePath2}: ${err.message}`))
// //         ]);

// //         res.send(result);
// //     } catch (error) {
// //         console.error('Error comparing images:', error); // Log error for debugging
// //         res.status(500).send(`An error occurred: ${error.message}`);
// //     }
// // };

// const __dirname = path.resolve(); // This line will provide the current directory path


// // export const compareImages = async (req, res) => {
// //     try {
// //         const { image1, image2 } = req.body;

// //         if (!image1 || !image2) {
// //             return res.status(400).send('Both images are required.');
// //         }

// //         // Function to decode base64 image and save it as a temporary file
// //         const saveBase64Image = async (base64Image, filename) => {
// //             const base64Data = base64Image.split(',')[1]; // Remove metadata
// //             const filePath = path.resolve(__dirname, 'uploads', filename); // Save to temp directory
// //             await fs.writeFile(filePath, base64Data, 'base64');
// //             return filePath;
// //         };

// //         // Save the images
// //         const imagePath1 = await saveBase64Image(image1, 'image2-1726232049952.jpg');
// //         const imagePath2 = await saveBase64Image(image2, 'image1-1726231966024.jpg');

// //         const comparator = new ImageComparator(imagePath1, imagePath2);
// //         const result = await comparator.compareImages();

// //         // Clean up uploaded files
// //         await Promise.all([
// //             fs.unlink(imagePath1).catch(err => console.error(`Failed to delete ${imagePath1}: ${err.message}`)),
// //             fs.unlink(imagePath2).catch(err => console.error(`Failed to delete ${imagePath2}: ${err.message}`))
// //         ]);

// //         res.send(result);
// //     } catch (error) {
// //         console.error('Error comparing images:', error); // Log error for debugging
// //         res.status(500).send(`An error occurred: ${error.message}`);
// //     }
// // };


// // Function to download an image from a URL


// const downloadImage = async (url, savePath) => {
//     const response = await axios.get(url, { responseType: 'arraybuffer' });
//     await fs.writeFile(savePath, response.data);
// };


// export const compareImages = async (req, res) => {
//     try {
//         const { image } = req.body;

//         if (!image) {
//             return res.status(400).send('Image is required.');
//         }

//         // Function to decode base64 image and save it as a temporary file
//         const saveBase64Image = async (base64Image, filename) => {
//             const base64Data = base64Image.split(',')[1]; // Remove metadata
//             const filePath = path.resolve(__dirname, 'uploads', filename); // Save to uploads directory
//             await fs.writeFile(filePath, base64Data, 'base64');
//             return filePath;
//         };

//         // Save the uploaded image
//         const uploadedImagePath = await saveBase64Image(image, 'uploaded_image.png');

//         // Retrieve all users and their images
//         const users = await User.find();
//         const comparisonResults = [];

//         for (const user of users) {
//             const storedImageUrl = user.imageUrl;
//             const storedImagePath = path.join(__dirname, 'uploads', path.basename(storedImageUrl));

//             // Download the stored image to a temporary file
//             await downloadImage(storedImageUrl, storedImagePath); // Ensure this function is defined

//             const comparator = new ImageComparator(uploadedImagePath, uploadedImagePath);
//             const result = await comparator.compareImages();

//             comparisonResults.push({ userId: user._id, userName: user.name, imageUrl: user.imageUrl, result });

//             // Clean up the stored image file
//             try {
//                 await fs.unlink(storedImagePath);
//             } catch (error) {
//                 console.error(`Failed to delete stored image for user ${user._id}: ${error.message}`);
//             }
//         }

//         // Check for matches in the results
//         const match = comparisonResults.find(res => res.result === "The images are the same.");
//         if (match) {
//             // Clean up the uploaded image file
//             await fs.unlink(uploadedImagePath).catch(err => console.error(`Failed to delete uploaded image: ${err.message}`));
//             return res.send({ message: 'Success: Matching image found.', ...match });
//         }

//         // Clean up uploaded image if no match found
//         await fs.unlink(uploadedImagePath).catch(err => console.error(`Failed to delete uploaded image: ${err.message}`));
//         res.status(404).send('Error: No matching image found.');

//     } catch (error) {
//         console.error('Error comparing images:', error);
//         res.status(500).send(`An error occurred: ${error.message}`);
//     }
// };



// export const uploadBase64Image = async (req, res) => {
//     try {
//         const { image } = req.body;

//         if (!image || typeof image !== 'string') {
//             return res.status(400).send('Image is required and must be a string.');
//         }

//         // Remove the data URL prefix if present
//         const base64Data = image.split(',')[1];

//         // const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64Data}`, {
//         //     folder: 'face_testing', // Specify the folder here
//         //     resource_type: 'image'
//         // });
//         const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64Data}`, {
//             folder: 'face', // Specify the existing folder here
//             resource_type: 'image'
//         });


//         res.json(result); // Send the upload result back to the client
//     } catch (error) {
//         console.error('Error uploading image to Cloudinary:', error);
//         res.status(500).send('Failed to upload image');
//     }
// };

// export const uploadBase64ImageAndCreateUser = async (req, res) => {
//     try {
//         const { name, image } = req.body;

//         if (!name || !image || typeof image !== 'string') {
//             return res.status(400).send('Name and image are required, and image must be a string.');
//         }

//         // Validate base64 image format
//         if (!/^data:image\/(png|jpg|jpeg);base64,/.test(image)) {
//             return res.status(400).send('Invalid image format.');
//         }

//         const base64Data = image.split(',')[1];

//         const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64Data}`, {
//             folder: 'face',
//             resource_type: 'image'
//         });

//         const newUser = new User({
//             name,
//             imageUrl: result.secure_url
//         });

//         await newUser.save();
//         res.json(newUser);
//     } catch (error) {
//         console.error('Error uploading image:', error);
//         res.status(500).send(`Failed to upload image: ${error.message}`);
//     }
// };
