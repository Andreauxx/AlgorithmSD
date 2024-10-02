from flask import Flask, request, jsonify
import pandas as pd

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze_csv():
    # Check if a file is in the request
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Read the CSV file using Pandas
        df = pd.read_csv(file)

        # Check if the necessary columns are in the CSV file
        if 'Correct Answers' not in df.columns or 'Incorrect Answers' not in df.columns:
            return jsonify({'error': 'CSV missing required columns'}), 400

        # Perform analysis
        total_correct = df['Correct Answers'].sum()
        total_incorrect = df['Incorrect Answers'].sum()
        total_questions_attempted = total_correct + total_incorrect

        # Calculate percentages
        correct_percentage = (total_correct / total_questions_attempted) * 100 if total_questions_attempted > 0 else 0
        incorrect_percentage = (total_incorrect / total_questions_attempted) * 100 if total_questions_attempted > 0 else 0

        # Result to be returned
        result = {
            'correct_answers': int(total_correct),
            'incorrect_answers': int(total_incorrect),
            'total_questions_attempted': int(total_questions_attempted),
            'correct_percentage': round(correct_percentage, 2),
            'incorrect_percentage': round(incorrect_percentage, 2)
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
