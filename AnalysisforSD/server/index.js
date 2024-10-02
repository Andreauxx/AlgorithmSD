import express from 'express';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import { fileURLToPath } from 'url';

// Use fileURLToPath and __dirname since ES modules don't have __dirname by default
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });  // Destination folder for file uploads

// Serve static files from the "FrontEnd" directory
app.use(express.static(path.join(__dirname, '../FrontEnd')));

// Route for students to upload their CSV file
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Send the file to the Python Flask server for analysis
        const form = new FormData();
        form.append('file', fs.createReadStream(file.path));

        const response = await axios.post('http://localhost:5001/analyze', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        // Remove the uploaded file after sending to Flask service
        fs.unlinkSync(file.path);

        // Send back the result from Flask to the client
        res.json(response.data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while analyzing the file' });
    }
});

// Start the Node.js server
app.listen(3000, () => {
    console.log('Node.js server running on http://localhost:3000');
});
