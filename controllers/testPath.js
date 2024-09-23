// import fs from 'fs/promises';
// import path from 'path';
// import { fileURLToPath } from 'url';

// // Resolve __dirname correctly
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Adjust UPLOAD_DIR based on your actual directory structure
// const UPLOAD_DIR = path.resolve(__dirname, '../uploads'); 

// // Path to the file to be checked
// const storedImagePath = path.resolve(UPLOAD_DIR, 'uploadedImage-1726233041048.jpg');

// const testFilePath = async () => {
//     console.log('Checking file path:', storedImagePath); // Debug output

//     try {
//         await fs.access(storedImagePath);
//         console.log('Stored image found at:', storedImagePath);
//     } catch (err) {
//         console.error('Error accessing file:', err);
//     }
// };

// testFilePath();
