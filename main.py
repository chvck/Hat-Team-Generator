from os.path import abspath, dirname, join
from time import strftime

from flask import Flask, request, send_from_directory, render_template

from utils import allowed_file, jsonify_csv, qsort, split_players, teamify


app = Flask(__name__)

@app.route('/', methods=['GET'])
def main():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    data = request.files['inputCSV']
    if data and allowed_file(data.filename):
        return jsonify_csv(data)

@app.route('/test', methods=['POST'])
def test_csv():
    return jsonify_csv(open(join(abspath(dirname(__file__)), 'test/test_hat_standard.txt'), 'r'))

@app.route('/generate', methods=['POST'])
def generate():
    players = request.json['players']
    if len(players) < 2:
        return jsonify({'status': 'failed', 'message': 'You might want a few more players, must have 2 or more.'})
        
    number_teams = int(request.json['numTeams'])
    if number_teams < 2:
        return jsonify({'status': 'failed', 'message': 'Too few teams, must have 2 or more.'})
        
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

    #print (teams)
    #teams['length'] = len(teams)
    return send_from_directory('downloads', filename)

if __name__ == '__main__':
    app.run(debug = True)

