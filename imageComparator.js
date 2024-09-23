import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export class ImageComparator {
    constructor(imagePath1, imagePath2) {
        this.imagePath1 = imagePath1;
        this.imagePath2 = imagePath2;
    }

    async loadImage(imagePath) {
        try {
            const image = sharp(imagePath)
                .ensureAlpha() // Ensure images have an alpha channel
                .raw() // Convert image to raw RGBA format
                .toBuffer({ resolveWithObject: true });
            return image;
        } catch (error) {
            throw new Error(`Failed to load image: ${imagePath}. Error: ${error.message}`);
        }
    }

    async compareImages() {
        try {
            const img1 = await this.loadImage(this.imagePath1);
            const img2 = await this.loadImage(this.imagePath2);

            // Check if images have the same dimensions
            if (img1.info.width !== img2.info.width || img1.info.height !== img2.info.height) {
                return "The images have different dimensions.";
            }

            const { data: img1Data, info: { width, height } } = img1;
            const { data: img2Data } = img2;

            // Create an empty PNG image for the diff result
            const diff = new PNG({ width, height });
            const numDiffPixels = pixelmatch(img1Data, img2Data, diff.data, width, height, { threshold: 0.1 });

            const totalPixels = width * height;
            const differencePercentage = numDiffPixels / totalPixels;

            return differencePercentage > 0.1 ? "The images are different." : "The images are the same.";
        } catch (error) {
            console.error('Error comparing images:', error);
            return "An error occurred during comparison.";
        }
    }
}
