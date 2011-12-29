from csv import DictReader
from time import strftime

from flask import Flask, jsonify, redirect, request, url_for, send_from_directory

from utils import allowed_file, qsort, split_players, teamify


app = Flask(__name__)

@app.route('/', methods=['GET'])
def main():
    return redirect(url_for('static', filename='index.html'))

@app.route('/upload', methods=['POST'])
def upload():
    players = {}
    data = request.files['inputCSV']
    if data and allowed_file(data.filename):
        players = {i: row for i, row in enumerate(DictReader(data))}
    players['length'] = len(players)
    return jsonify(players)

@app.route('/test', methods=['POST'])
def test_read_csv():
    players = {i: row for i, row in enumerate(DictReader(open('../hatstuff.txt', 'r')))}
    players['length'] = len(players)
    return jsonify(players)

@app.route('/generate', methods=['POST'])
def generate():
    players = request.json['players']
    number_teams = int(request.json['numTeams'])
    players_per_team = len(players) / number_teams
    ranked_players = []
    formula = {}
    columns = request.json['columns']
    for column in columns:
        if int(columns[column]) != 0:
            formula[column.strip()] = int(columns[column])
    total_points = 0
    for player in players:
        player_points = 0
        for attribute in player:
            if formula.has_key(attribute.strip()):
                player_points += (int(player[attribute]) * formula[attribute.strip()])
        player['points'] = player_points
        total_points += player_points
    ranked_players = qsort(players)
    ranked_players = split_players(ranked_players, number_teams)

    teams = teamify(ranked_players, number_teams, total_points)

    for team in teams:
        points = 0
        for player in team['players']:
            print player
            points += player['points']
        print points
        print team['points']
        print ''

    filename = '%s.csv' % strftime('%Y-%m-%d %H-%M-%S')
    with open('downloads/' + filename, 'w') as team_file:
        line = 'Team,'
        for column in columns:
            line = line + column + ','
        line = line + 'Points' + '\n'
        team_file.write(line)
        for team in teams:
            points = 0
            for player in team['players']:
                line = str(teams.index(team)) + ','
                for column in columns:
                    line = line + str(player[column]) + ','
                line = line + str(player['points']) + '\n'
                team_file.write(line)
                points += player['points']
            team_file.write('Total team points: %s, Average player player points: %s\n' % (
                            str(points), str(points/len(team['players']))))

    print (teams)
    #teams['length'] = len(teams)
    return send_from_directory('downloads', filename)

if __name__ == '__main__':
    app.run(debug = True)

