import express from 'express';
import multer from 'multer';
import fs from 'fs';
import csvParser from 'csv-parser';
import _ from 'lodash';
import { mean, std, median } from 'mathjs';

const app = express();
const upload = multer({ dest: 'uploads/' });  // Destination folder for file uploads

// Serve static files from the "FrontEnd" directory
app.use(express.static('AlgorithmSD/FrontEnd')); // Adjust this path if needed

// Route for students to upload their CSV file
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const rows = [];
        // Read and parse the CSV file
        fs.createReadStream(file.path)
            .pipe(csvParser())
            .on('data', (data) => rows.push(data))
            .on('end', async () => {
                // Remove the uploaded file after processing
                fs.unlinkSync(file.path);

                // Perform analysis using lodash and math.js
                const analysis = await performComplexAnalysis(rows);

                // Send back the analysis results
                res.json(analysis);
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while analyzing the file' });
    }
});

// Function to perform more complex analysis on rows (array of objects)
async function performComplexAnalysis(rows) {
    // Extract Correct Answers and Incorrect Answers columns
    const correctAnswers = rows.map(row => parseInt(row['Correct Answers'], 10) || 0);
    const incorrectAnswers = rows.map(row => parseInt(row['Incorrect Answers'], 10) || 0);
    const totalQuestionsAttempted = correctAnswers.map((c, i) => c + incorrectAnswers[i]);

    // Mean, standard deviation, and median calculations for correct answers
    const correctMean = mean(correctAnswers);
    const correctStdDev = std(correctAnswers);
    const correctMedian = median(correctAnswers);

    // Highest and lowest performers (based on Correct Answers)
    const highestPerformer = _.maxBy(rows, row => parseInt(row['Correct Answers'], 10));
    const lowestPerformer = _.minBy(rows, row => parseInt(row['Correct Answers'], 10));

    return {
        total_students: rows.length,
        correct_mean: correctMean.toFixed(2),
        correct_std_dev: correctStdDev.toFixed(2),
        correct_median: correctMedian,
        highest_performer: highestPerformer['Roll No'] || "Unknown",
        lowest_performer: lowestPerformer['Roll No'] || "Unknown",
        total_questions_attempted: _.sum(totalQuestionsAttempted),
        correct_answers_total: _.sum(correctAnswers),
        incorrect_answers_total: _.sum(incorrectAnswers),

        // Send the graph data to the frontend for rendering with Chart.js
        graph_data: {
            labels: ['Correct', 'Incorrect'],
            datasets: [{
                label: 'Questions Breakdown',
                data: [_.sum(correctAnswers), _.sum(incorrectAnswers)],
                backgroundColor: ['#36a2eb', '#ff6384']
            }]
        }
    };
}

// Start the Node.js server
app.listen(4000, () => {
    console.log('Node.js server running on http://localhost:4000');
});
