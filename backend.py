import csv
import random

from flask import Flask, jsonify, redirect, request, url_for


ALLOWED_EXTENSIONS = set(['txt', 'csv'])

app = Flask(__name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET'])
def main():
    return redirect(url_for('static', filename='index.html'))

@app.route('/upload', methods=['POST'])
def upload():
    players = {}
    data = request.files['inputCSV']
    if data and allowed_file(data.filename):
        reader = csv.DictReader(data, delimiter=',')
        players = dict((i, row) for (i, row) in enumerate(reader))
    players['length'] = len(players)
    return jsonify(players)

@app.route('/test', methods=['POST'])
def test_read_csv():
    players = {}
    with open('../hatstuff.txt', 'r') as f:
        players = dict((i, row) for (i, row) in enumerate(csv.DictReader(f)))
        players['length'] = len(players)
    return jsonify(players)

def qsort(slist):
    if not slist:
        return []
    pivot = slist[0]
    lesser = qsort([x for x in slist[1:] if x['points'] > pivot['points']])
    greater = qsort([x for x in slist[1:] if x['points'] <= pivot['points']])
    return lesser + [pivot] + greater

def split_players(players, num_teams):
    """
    This splits the players into several lists of the size num_teams, this means that when
    creating the teams we can pick 1 player from each list for each team
    TODO: test this with a number of teams not exactly divisible by num_teams
    """
    return [players[i*num_teams: (i+1)*num_teams]
            for i in xrange(len(players) // num_teams)]

def teamify(players, num_teams, total_points):
    """
    Here we create the actual teams. The theory behind this algorithm is that we get the
    total number of player points available and split the points evenly between each team.
    We then go over each list of players and randomly assign each player to a team (one per team).
    The random function takes into account the number of points left available to the current team
    and weights the random accordingly. If the team has a low number of points left then they get
    a player that is toward the end of the list (we have ordered the players so that index 0 is the
    best player and index -1 the worst)
    """
    teams = {}
    random.seed()
    points_per_team = total_points // num_teams

    #create the correct number of teams. Must be a better way to do this?
    for i in xrange(num_teams):
        teams[i] = {'players': [], 'points': points_per_team}

    for list_players in players:
        if len(list_players) > 0:
            for teamKey in teams:
                index = random.randint(0, len(list_players)-1)
                teams[teamKey]['players'].append(list_players[index])
                teams[teamKey]['points'] -= list_players[index]['points']
                list_players.pop(index)
            #if len(list_players) > 0:
            #    for i in xrange(len(list_players)):
            #        index = random.randint(0, len(teams)-1)
            #        teams[index]['players'].append(list_players[0])
            #        #team['points'] -= list_players[0]['points']
            #        list_players.pop(0)
    return teams

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
        for player in teams[team]['players']:
            print player
            points += player['points']
        print ''
    #print (teams)
    teams['length'] = len(teams)
    return jsonify(teams)

if __name__ == '__main__':
    app.run(debug = True)

