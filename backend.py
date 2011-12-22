from flask import Flask
from flask import request
from flask import redirect
from flask import url_for
from flask import jsonify
from werkzeug import secure_filename
import csv

ALLOWED_EXTENSIONS = set(['txt', 'csv'])

app = Flask(__name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET'])
def main():
    return redirect(url_for('static', filename='index.html'))

@app.route('/upload', methods=['POST'])
def upload():
    players = {}
    data = request.files['inputCSV']
    if data and allowed_file(data.filename):
        reader = csv.DictReader(data, delimiter=',')
        i = 0
        for row in reader:
            players[i] = row
            i += 1
    players['length'] = len(players);
    return jsonify(players)   

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    return ''
        
if __name__ == '__main__':
    app.debug = True
    app.run()