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
    #data = request.files['inputCSV']
    #if data and allowed_file(data.filename):
    #reader = csv.DictReader(data, delimiter=',')
    reader = csv.DictReader(open('../hatstuff.txt', 'r'), delimiter=',')
    i = 0
    for row in reader:
        players[i] = row
        i += 1
    players['length'] = len(players)
    return jsonify(players)
    
def qsort(list):
    if list == []: 
        return []
    else:
        pivot = list[0]
        lesser = qsort([x for x in list[1:] if x['points'] > pivot['points']])
        greater = qsort([x for x in list[1:] if x['points'] <= pivot['points']])
        return lesser + [pivot] + greater

def split_players(players, playersPerTeam):
    i = 0
    splitted = []
    while (i < len(players)):
        thisSplit = []
        for j in range(0, playersPerTeam):
            thisSplit.append(players[j])
            players.pop(j)
        splitted.append(thisSplit)
        i += playersPerTeam
    if len(players) > 0:
        for player in players:
            splitted[-1].append(player)
    return splitted

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    players = data['players']
    numberTeams = int(data['numTeams'])
    playersPerTeam = len(players) / numberTeams
    rankedPlayers = []
    formula = {}
    columns = data['columns']
    for column in columns:
        if int(columns[column]) != 0:
            formula[column.strip()] = int(columns[column])
    totalPoints = 0
    for player in players:
        playerPoints = 0
        for attribute in player:
            if formula.has_key(attribute.strip()):
                playerPoints += (int(player[attribute]) * formula[attribute.strip()])
        player['points'] = playerPoints
        totalPoints += playerPoints
    rankedPlayers = qsort(players)
    rankedPlayers = split_players(rankedPlayers, playersPerTeam)
    for block in rankedPlayers:
        for player in block:
            print player
        print ''
    print totalPoints
    return ''
        
if __name__ == '__main__':
    app.debug = True
    app.run()